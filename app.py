from flask import Flask
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://branweb@localhost/groceries"

db.init_app(app)

# this (de)serializes an object into json
class MenuSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

class IngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    unit = fields.Str(required=False)

class MealSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    menu = fields.Nested(MenuSchema(), dump_only=True)
    ingredients = fields.List(fields.Nested(IngredientSchema(), dump_only=True))

bp = Blueprint('Main', 'main')

# this converts db row to object
class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(3), nullable=False, unique=True)
    meals = db.relationship('Meal', back_populates='menu', lazy='immediate')

class Meal(db.Model):
    __tablename__ = 'meals'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    menu_id = db.mapped_column(db.ForeignKey('menus.id'))
    menu = db.relationship('Menu', back_populates='meals', lazy='immediate')
    ingredients = db.relationship('Ingredient', back_populates='meals', secondary='meals_ingredients', lazy='immediate')

class Ingredient(db.Model):
    __tablename__ = 'ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    category = db.Column(db.Text, nullable=False, unique=False)
    unit = db.Column(db.Text, nullable=False, unique=False)
    meals = db.relationship('Meal', back_populates='ingredients', secondary='meals_ingredients', lazy='immediate')

class MealsIngredients(db.Model):
    __tablename__ = 'meals_ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    meal_id = db.mapped_column(db.ForeignKey('meals.id'))
    ingredient_id = db.mapped_column(db.ForeignKey('ingredients.id'))
    quantity = db.Column(db.Numeric, nullable=True, unique=False)

#@bp.arguments(MenuSchema)
@bp.route('/')
@bp.response(200, MenuSchema(many=True))
def index():
    return Menu.query.all()

@bp.route('/meals')
@bp.response(200, MealSchema(many=True))
def meal_index():
    return Meal.query.all()

@bp.route('/meals/<int:meal_id>')
@bp.response(200, MealSchema)
def get_meal(meal_id):
    return Meal.query.get_or_404(meal_id)

@bp.route("/<int:menu_id>")
@bp.response(200, MenuSchema)
def get(menu_id):
    for menu in menus:
        if menu["id"] == menu_id:
            return menu
    abort(404, message="not found")


app.register_blueprint(bp)
