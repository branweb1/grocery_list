from flask import Flask
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://branweb@localhost/groceries"

db.init_app(app)

class MenuSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)

bp = Blueprint('Main', 'main')

class Menu(db.Model):
    __tablename__ = 'menus'
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(3), nullable=False, unique=True)

menus = [{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]

#@bp.arguments(MenuSchema)
@bp.route('/')
@bp.response(200, MenuSchema(many=True))
def index():
    return Menu.query.all()

@bp.route("/<int:menu_id>")
@bp.response(200, MenuSchema)
def get(menu_id):
    for menu in menus:
        if menu["id"] == menu_id:
            return menu
    abort(404, message="not found")     


app.register_blueprint(bp)
