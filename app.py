from flask import Flask, request, send_from_directory
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields, post_load
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import NoResultFound
from sqlalchemy import text

db = SQLAlchemy()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://branweb@localhost/groceries"

db.init_app(app)

# this (de)serializes an object into json
class IngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    unit = fields.Str(required=False)
    category = fields.Str(required=True) # TODO constrain category

    @post_load
    def make_ingredient(self, data, **kwargs):
        return Ingredient(**data)

class MealSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    menu_id = fields.Int(required=False)

    @post_load
    def make_meal(self, data, **kwargs):
        return Meal(**data)

class MenuSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    
    @post_load
    def make_menu(self, data, **kwargs):
        return Menu(**data)

class MealIngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    quantity = fields.Decimal(places=2, dump_only=True)
#    ingredient = fields.Nested(IngredientSchema(), dump_only=True)
    meal_id = fields.Int(dump_only=True)
    ingredient_id = fields.Int(dump_only=True)
    
    @post_load
    def make_meal_ingredient(self, meal_id, ingredient_id, quantity):
        return MealIngredient(meal_id=meal_id, ingredient_id=ingredient_id, quantity=quantity)

class SimpleIngredientSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(dump_only=True)
    quantity = fields.Decimal(places=2, dump_only=True)
    unit = fields.Str(dump_only=True)

class CategorySchema(Schema):
    categories = fields.List(fields.Str)

# TODO: clean these up..maybe don't used mapped_column?
# this converts db row to objectn
class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=True)
    meals = db.relationship('Meal', back_populates='menu', lazy='dynamic')

class Meal(db.Model):
    __tablename__ = 'meals'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    menu_id = db.mapped_column(db.ForeignKey('menus.id'))
    menu = db.relationship('Menu', back_populates='meals')
    ingredients = db.relationship('MealIngredient', back_populates='meal')

class Ingredient(db.Model):
    __tablename__ = 'ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False, unique=False)
    category = db.Column(db.Text, nullable=False, unique=False)
    unit = db.Column(db.Text, nullable=True, unique=False)
    meals = db.relationship('MealIngredient', back_populates='ingredient')

class MealIngredient(db.Model):
    __tablename__ = 'meals_ingredients'
    id = db.mapped_column(db.Integer, primary_key=True)
    meal_id = db.mapped_column(db.ForeignKey('meals.id'))
    ingredient_id = db.mapped_column(db.ForeignKey('ingredients.id'))
    quantity = db.Column(db.Numeric, nullable=True, unique=False)
    meal = db.relationship('Meal', back_populates='ingredients')
    ingredient = db.relationship('Ingredient', back_populates='meals')

# aux classes
class SimpleIngredient:
    def __init__(self, id, name, quantity, unit):
        self.id = id
        self.name  = name
        self.quantity = quantity
        self.unit = unit

# routes/controllers
# TODO: split these up
bp = Blueprint('Api', 'api', url_prefix='/api/groceries/v1')


@bp.get('/ingredients')
@bp.response(200, IngredientSchema(many=True))
def ingredient_index():
    return Ingredient.query.all()

# TODO handle eror if user posts id that is not a menu id
# right now throws psycopg2.errors.ForeignKeyViolation:
@bp.post('/ingredients')
@bp.response(201, IngredientSchema)
def create_ingredient():
    schema = IngredientSchema()
    ingredient = schema.make_ingredient(request.json)
    db.session.add(ingredient)
    db.session.commit()
    return ingredient

@bp.post('/ingredients/batch')
@bp.response(201, IngredientSchema(many=True))
def create_ingredient_batch():
    schema = IngredientSchema()
    ingredients = [schema.make_ingredient(item) for item in request.json]
    for ingredient in ingredients:
        db.session.add(ingredient)
    db.session.commit()
    return ingredients

@bp.put('/ingredients/<int:ingredient_id>')
@bp.response(200, IngredientSchema)
def update_ingredient(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    ingredient.name = request.json['name']
    ingredient.unit = request.json['unit']
    ingredient.name = request.json['category']
    db.session.add(ingredient)
    db.session.commit()
    return meal

@bp.get('/ingredients/<int:ingredient_id>')
@bp.response(200, IngredientSchema)
def read_ingredient(ingredient_id):
    return Ingredient.query.get_or_404(ingredient_id)

@bp.get('/ingredients/categories')
def get_categories():
    results = Ingredient.query.distinct(Ingredient.category).all()
    categories = []
    for result in results:
        categories.append(result.category)
    return categories, 200

@bp.get('/ingredients/units')
def get_units():
    results = Ingredient.query.distinct(Ingredient.unit).filter(Ingredient.unit != None, Ingredient.unit != '').all()
    units = []
    for result in results:
        units.append(result.unit)
    return units, 200


@bp.delete('/ingredients/<int:ingredient_id>')
@bp.response(200)
def delete_ingredient(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    db.session.delete(ingredient)
    db.session.commit()
    return {"message": "ingredient deleted"}

# MENUS
@bp.get('/menus')
@bp.response(200, MenuSchema(many=True))
def menu_index():
    return Menu.query.all()

@bp.post('/menus')
@bp.response(201, MenuSchema)
def create_menu():
    schema = MenuSchema()
    menu = schema.make_menu(request.json)
    db.session.add(menu)
    db.session.commit()
    return menu

@bp.put('/menus/<int:menu_id>')
@bp.response(200, MenuSchema)
def update_menus(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    menu.name = request.json['name']
    db.session.add(menu)
    db.session.commit()
    return menu

@bp.get("/menus/<int:menu_id>")
@bp.response(200, MenuSchema)
def read_menu(menu_id):
    return Menu.query.get_or_404(menu_id)

# TODO: handle if menu has meals
@bp.delete('/menus/<int:menu_id>')
def delete_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    name = menu.name
    db.session.delete(menu)
    db.session.commit()
    return {"message": f"menu {name} deleted."}

@bp.get('/menus/<int:menu_id>/meals')
@bp.response(200, MealSchema(many=True))
def get_meals_for_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return menu.meals

@bp.get('/menus/<int:menu_id>/shopping_list/')
def get_shopping_list(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    # TODO include stuff common to all menus? Or maybe make that an option
    sections = db.session.execute(text(
        "with foo as (select i.category,i.name,i.unit,sum(mi.quantity) as qty from meals_ingredients mi join meals m on m.id = mi.meal_id join ingredients i on i.id = mi.ingredient_id where m.menu_id = :val group by i.category, i.name, i.unit) select json_build_object('category', category, 'items', json_agg(json_build_object('name', name, 'quantity', qty, 'unit', unit))) from foo group by foo.category"
    ), {"val": menu_id})

    with open('public/shopping_list.txt', 'w') as outfile:
        outfile.write(f"MENU {menu.name}\n")
        for section_list in sections:
            section = section_list[0]

            outfile.write(f"{section['category']}\n")
            outfile.write("------------\n")

            for item in section['items']:
                if item['quantity'] is None:
                    outfile.write(f"{item['name']}\n")
                else:
                    unit = item['unit'] or ''
                    if unit:
                        unit = f" {unit}"
                    outfile.write(f"{item['name']} - {item['quantity']}{unit}\n")

            outfile.write('\n\n')
    return send_from_directory('public', 'shopping_list.txt', as_attachment=True), 200

# MEALS
@bp.put('/meals/<int:meal_id>/menus/<int:menu_id>')
@bp.response(200, MealSchema)
def add_meal_to_menu(meal_id, menu_id):
    menu = Menu.query.get_or_404(menu_id)
    meal = Meal.query.get_or_404(meal_id)
    meal.menu_id = menu.id
    db.session.add(meal)
    db.session.commit()
    return meal

@bp.delete('/meals/<int:meal_id>/menus')
@bp.response(200, MealSchema)
def delete_meal_from_menu(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    meal.menu_id = None
    db.session.add(meal)
    db.session.commit()
    return meal

@bp.delete('/meals/<int:meal_id>')
def delete_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    name = meal.name
    db.session.delete(meal)
    db.session.commit()
    return {"message": f"meal {name} deleted"}

@bp.get('/meals')
@bp.response(200, MealSchema(many=True))
def meal_index():
    return Meal.query.all()

# TODO handle eror if user posts in that is not a menu id
# right now throws psycopg2.errors.ForeignKeyViolation:
@bp.post('/meals')
@bp.response(201, MealSchema)
def create_meal():
    schema = MealSchema()
    meal = schema.make_meal(request.json)
    db.session.add(meal)
    db.session.commit()
    return meal

@bp.put('/meals/<int:meal_id>')
@bp.response(200, MealSchema)
def update_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    meal.name = request.json['name']
    db.session.add(meal)
    db.session.commit()
    return meal


@bp.get('/meals/<int:meal_id>')
@bp.response(200, MealSchema)
def read_meal(meal_id):
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
                id = ingredient.ingredient.id,
                name = ingredient.ingredient.name,
                quantity = ingredient.quantity,
                unit = ingredient.ingredient.unit
            )
        )
    return simple_ingredients

# MEALS/INGREDIENTS (MANY TO MANY)
# TODO: could probably have this take an array of ingredient_ids, then in the body,
# do a foreach id -> make_meal_ingredient, etc.
@bp.post('/meals-ingredients')
@bp.response(201, MealIngredientSchema)
def add_ingredients_to_meal():
    schema = MealIngredientSchema()
    meal_ingredient = schema.make_meal_ingredient(request.json)
    db.session.add(meal_ingredient)
    db.session.commit()
    return meal_ingredient

@bp.post('/meals-ingredients/batch')
@bp.response(201, MealIngredientSchema(many=True))
def fake():
    schema = MealIngredientSchema()
    meal_id = request.json["meal_id"]
    ingredients = request.json["ingredients"]
    created = []
    for ingredient in ingredients:
        ingredient_id = ingredient["id"]
        qty = ingredient["quantity"] if "quantity" in ingredient else None
        meal_ingredient = schema.make_meal_ingredient(meal_id, ingredient_id, qty)
        created.append(meal_ingredient)
        db.session.add(meal_ingredient)
    db.session.commit()
    return created

@bp.put('/meals-ingredients/batch')
@bp.response(200, MealIngredientSchema(many=True))
def update_meals_ingredients():
    schema = MealIngredientSchema()
    meal_id = request.json["meal_id"]
    ingredients = request.json["ingredients"]
    meal = Meal.query.get_or_404(meal_id)
    meal_ingredients = meal.ingredients
    updated = []
    for ingredient in ingredients:
        for meal_ingredient in meal_ingredients:
            if meal_ingredient.ingredient_id == ingredient['id']:
                meal_ingredient.quantity = ingredient['quantity']
                updated.append(meal_ingredient)
                db.session.add(meal_ingredient)
                break;
    db.session.commit()

    return updated


@bp.delete('/meals-ingredients')
@bp.response(200, MealIngredientSchema)
def delete_ingredient_from_meal():
    #TODO: handle if these are not present
    meal_id = request.json['meal_id']
    ingredient_id = request.json['ingredient_id']
    try:
        meal_ingredient = MealIngredient.query.where(MealIngredient.meal_id == meal_id).where(MealIngredient.ingredient_id == ingredient_id).one()
        db.session.delete(meal_ingredient)    
        db.session.commit()
    except NoResultFound:
        abort(404, message='not found')
    return {"message": "deleted"}

from werkzeug.exceptions import HTTPException

bp_two = Blueprint('Main', 'main', static_folder='frontend/public', static_url_path="/frontend/public")
@bp_two.route('/', defaults={'path': ''})
@bp_two.route('/<path:path>')
def handle_thing(path):
    return bp_two.send_static_file('index.html')

app.register_blueprint(bp)
app.register_blueprint(bp_two)
