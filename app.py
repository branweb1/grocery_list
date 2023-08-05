from flask import Flask, request
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields, post_load
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://branweb@localhost/groceries"

db.init_app(app)

# this (de)serializes an object into json

# class IngredientSchema(Schema):
#     id = fields.Int(dump_only=True)
#     name = fields.Str(required=True)
#     unit = fields.Str(required=False)

class MealSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

class MenuSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    
    @post_load
    def make_menu(self, data, **kwargs):
        return Menu(**data)

# class MealIngredientSchema(Schema):
#     id = fields.Int(dump_only=True)
#     quantity = fields.Decimal(places=2, dump_only=True)
#     ingredient = fields.Nested(IngredientSchema(), dump_only=True)

class SimpleIngredientSchema(Schema):
    name = fields.Str(dump_only=True)
    quantity = fields.Decimal(places=2, dump_only=True)
    unit = fields.Str(dump_only=True)



bp = Blueprint('Main', 'main')

# TODO: clean these up..maybe don't used mapped_column?
# this converts db row to objectn
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

# aux classes
class SimpleIngredient:
    def __init__(self, name, quantity, unit):
        self.name  = name
        self.quantity = quantity
        self.unit = unit

#@bp.arguments(MenuSchema)
@bp.get('/menus')
@bp.response(200, MenuSchema(many=True))
def menu_index():
    return Menu.query.all()

@bp.post('/menus')
@bp.response(201, MenuSchema)
def create_menus():
    schema = MenuSchema()
    menu = schema.make_menu(request.json)
    db.session.add(menu)
    db.session.commit()
    return menu

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
@bp.response(200, SimpleIngredientSchema(many=True))
def get_ingredients_for_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    ingredients = meal.ingredients
    simple_ingredients = []
    for ingredient in ingredients:
        simple_ingredients.append(
            SimpleIngredient(
                name = ingredient.ingredient.name,
                quantity = ingredient.quantity,
                unit = ingredient.ingredient.unit
            )
        )
    return simple_ingredients

# CRUD menu--would just be the name
# get /menu all menus
# post /menu create new menu
# get /menu/<id> view menu
# put /menu/<id> edit menu
# delete /menu/<id> delete given menu

# CRUD meals
# CRUD ingredients
# associate ingredient with a meal
# supply ingredient quantity
# associate meal with a menu

# so basically find out how to do crud ops on one-to-many (menu:meals), then many-to-many (meals:ingredients)

# GET /menus/<id>/meal see meals on a menu
# PUT  /meals/<id>/menus/<id> add a meal to a menu
# DELETE /meals/<id>/menus remove a meal from a menu

# TODO: how to do multiple? Could we just take an array of ingredient ids?
# POST /meals-ingredients with body {meal_id: <id>, ingredient_id: <id> }
# DELETE /meals-ingredients with body {meal_id: <id>, ingredient_id: <id> }
# GET is still /meals/<id>/ingredients


# Get menu
# get meal
# add and commit to db

app.register_blueprint(bp)
