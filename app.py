from flask import Flask
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://branweb@localhost/groceries"

db.init_app(app)

# this (de)serializes an object into json

class IngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    unit = fields.Str(required=False)

class MealSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

class MenuSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

class MealIngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    quantity = fields.Decimal(places=2, dump_only=True)
    ingredient = fields.Nested(IngredientSchema(), dump_only=True)


bp = Blueprint('Main', 'main')

# TODO: clean these up..maybe don't used mapped_column?
# this converts db row to object
class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(3), nullable=False, unique=True)
    meals = db.relationship('Meal', back_populates='menu', lazy='dynamic')

class Meal(db.Model):
    __tablename__ = 'meals'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    menu_id = db.mapped_column(db.ForeignKey('menus.id'))
    menu = db.relationship('Menu', back_populates='meals')
    ingredients = db.relationship('MealsIngredients', back_populates='meal')

class Ingredient(db.Model):
    __tablename__ = 'ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    category = db.Column(db.Text, nullable=False, unique=False)
    unit = db.Column(db.Text, nullable=False, unique=False)
    meals = db.relationship('MealsIngredients', back_populates='ingredient')

class MealsIngredients(db.Model):
    __tablename__ = 'meals_ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    meal_id = db.mapped_column(db.ForeignKey('meals.id'))
    ingredient_id = db.mapped_column(db.ForeignKey('ingredients.id'))
    quantity = db.Column(db.Numeric, nullable=True, unique=False)
    meal = db.relationship('Meal', back_populates='ingredients')
    ingredient = db.relationship('Ingredient', back_populates='meals')

#@bp.arguments(MenuSchema)
@bp.route('/menus')
@bp.response(200, MenuSchema(many=True))
def menu_index():
    return Menu.query.all()

@bp.route("/menus/<int:menu_id>")
@bp.response(200, MenuSchema)
def get_menu(menu_id):
    return Menu.query.get_or_404(menu_id)

@bp.route('/menus/<int:menu_id>/meals')
@bp.response(200, MealSchema(many=True))
def get_meals_for_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return menu.meals

@bp.route('/meals')
@bp.response(200, MealSchema(many=True))
def meal_index():
    return Meal.query.all()

@bp.route('/meals/<int:meal_id>')
@bp.response(200, MealSchema)
def get_meal(meal_id):
    return Meal.query.get_or_404(meal_id)

@bp.route('/meals/<int:meal_id>/ingredients')
@bp.response(200, MealIngredientSchema(many=True))
def get_ingredients_for_meal(meal_id):
    # TODO custom schema and do some transformation on these? Maybe make another class, create objects, and write a schema that maps to that class?
    meal = Meal.query.get_or_404(meal_id)
    return meal.ingredients

app.register_blueprint(bp)
