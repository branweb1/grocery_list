import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

async function fetchMenus() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/menus');
  const menus = await response.json();
  return menus;
}

async function deleteMenu(menuId) {
  return await fetch(`http://localhost:5000/api/groceries/v1/menus/${menuId}`, {method: 'DELETE'});
}

function Home() {
  const [menus, setMenus] = useState([]);
  const [textBoxes, setTextBoxes] = useState(0);
  const [values, setValues] = useState([]);

  useEffect(() => {
    fetchMenus().then(menus => {
      setMenus(menus);
    });
  }, []);

  const handleClick = (menuId) => {
    if (window.confirm('are you sure?')) {
      deleteMenu(menuId).then(() => setMenus(menus => menus.filter(m => m.id !== menuId)));
    }
  }

  const handleChange = (idx, e) => {
    const x = [...values]
    x[idx] = e.target.value;
    setValues(x);
  }

  const handleAddClick = () => {
    setTextBoxes(tbs => tbs + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(values)
    fetch('http://localhost:5000/api/groceries/v1/menus', {headers: {"Content-Type": "application/json"}, method: 'POST', body: JSON.stringify({name: values[0]})}).then(r => r.json()).then(b => setMenus(menus => [...menus, b])).then(() => {
      setValues([]);
      setTextBoxes(0)
    }).catch(e => console.error(e))
  }

  return (
    <div className={styles.container}>
      <header>
        <h3>Grocery List</h3>
      </header>
      <ul>
        {menus.map(menu => {
          return (
            <li>
              <Link to={`http://localhost:5000/menus/${menu.id}/meals`}>
                {menu.name}
              </Link>
              <button onClick={() => handleClick(menu.id)}>delete</button>
            </li>
          )
        })}
      </ul>
      <button onClick={handleAddClick}>add</button>
      <form onSubmit={handleSubmit}>
        {[...Array(textBoxes).keys()].map(idx => {
          return <input name={`new-menu-${idx}`} key={`asdf-${idx}`} value={values[idx] || ''} onChange={(e) => handleChange(idx, e)} type="text"/>
        })}
        <input type="submit" value="save"/>
      </form>
    </div>
  );
}

async function fetchMealsForMenu(menuId) {
  const response = await fetch(`http://localhost:5000/api/groceries/v1/menus/${menuId}/meals`);
  const meals = await response.json();
  return meals
}

async function fetchMeals() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/meals');
  const meals = await response.json();
  return meals;
}

function addMealToMenus(mealId, menuId) {
  // put to meals/${mealId}/menus/${menuId}
}

function Foo() {
  const { menuId } = useParams();
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);
  const [modal, toggleModal] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [modalPage, setModalPage] = useState('');

  const handleClick = (meal) => {
    setMeals(meals => [...meals, meal]);
    setAllMeals(allMeals => allMeals.filter(m => m.id !== meal.id))
  }

  const handleDeleteClick = (meal) => {
    setMeals(meals.filter(m => m.id !== meal.id));
    setAllMeals([...allMeals, meal]);
  }

  const handleToggleModal = (mealId) => {
    setCurrentMeal(mealId);
    setModalPage('existingMeal');
    toggleModal(true);
  }

  const handleAddMeal = () => {
    setModalPage('newMeal');
    toggleModal(true);
    
  }

  const getModalBody = (mealId) => {
    switch(modalPage) {
      case 'newMeal':
        return (<OtherModalBody menuId={menuId}/>);
      case 'existingMeal':
        return (<ModalBody mealId={mealId}/>);
      default:
        return null;
    }
  }

  useEffect(() => {
    Promise.all([fetchMeals(), fetchMealsForMenu(menuId)]).then(xs => {
      const [meals, mealsForMenu] = xs;
      const menuMealIds = mealsForMenu.map(m => m.id);
      setAllMeals(meals.filter(m => !menuMealIds.includes(m.id)))
      setMeals(mealsForMenu)
    })
  }, []);

  const handleSave = () => {
    const calls = meals.map(meal => fetch(`http://localhost:5000/api/groceries/v1/meals/${meal.id}/menus/${menuId}`, {method: 'PUT'}))
    return Promise.all(calls).then(r => console.log(r))
  }

  return (
    <div>
      <ul>
        {meals.map(meal => <li key={meal.id}>
                             <a href="#" onClick={() => handleToggleModal(meal.id)}>{meal.name}</a>
                             <button onClick={() => handleDeleteClick(meal)}>delete</button>
                           </li>)}
      </ul>
      <button onClick={handleSave}>save</button>
      <hr/>
      <ul>
        {allMeals.map(meal => <li key={`${meal.id}-foo`} onClick={() => handleClick(meal)}>{meal.name}</li>)}
      </ul>
      <button onClick={handleAddMeal}>new meal</button>
      <a href={`http://localhost:5000/api/groceries/v1/menus/${menuId}/shopping_list`}>download with a tag</a>
      {modal && <Modal>{getModalBody(currentMeal)}</Modal> }
    </div>
  );
}

async function fetchIngredientsForMeal(mealId) {
  const response = await fetch(`http://localhost:5000/api/groceries/v1/meals/${mealId}/ingredients`);
  const ingredients = response.json();
  return ingredients;
}

async function fetchAllIngredients() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/ingredients');
  const ingredients = response.json();
  return ingredients;
}

async function fetchAllCategories() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/ingredients/categories');
  const categories = response.json();
  return categories;
}

async function fetchAllUnits() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/ingredients/units');
  const units = response.json();
  return units;
}

function ModalBody({mealId}) {
  if (!mealId) return;

  // TODO: generalize this
  const [ingredients, setIngredients] = useState([])
  const [allIngredients, setAllIngredients] = useState([]);

  useEffect(() => {
    fetchIngredientsForMeal(mealId).then(ingredients => setIngredients(ingredients))
  }, []);

  useEffect(() => {
    fetchAllIngredients().then(is => setAllIngredients(is.map(i => i.name)));
  }, []);

  return (<div>
    <ul>
      {ingredients.map(i => <li key={`${i.id}-${i.name}`}>{i.name} {i.quantity} {i.unit}</li>)}
    </ul>
    <AutoComplete suggestions={allIngredients}/>
  </div>);
}

function OtherModalBody({menuId}) {
  const [textBoxes, setTextBoxes] = useState(0);
  const [values, setValues] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredientIdMap, setIngredientIdMap] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [mealName, setMealName] = useState('');

  useEffect(() => {
    fetchAllIngredients().then(is => {
      setAllIngredients(is.map(i => i.name));
      setIngredientIdMap(is.reduce((acc, i) => {
        return Object.assign(acc, {[i.name]: i.id});
      }, {}))
    });
  }, []);

  useEffect(() => {
    fetchAllUnits().then(us => setAllUnits(us));
  }, []);

  useEffect(() => {
    fetchAllCategories().then(cs => setAllCategories(cs));
  }, []);

  const handleAddClick = () => {
    setTextBoxes(tbs => tbs + 1);
  };

  const handleChange = (idx, value, field) => {
    const x = [...values]
    const item = x[idx];
    if (item) {
      x[idx] = {...item, [field]: value};
    } else {
      const foo = {};
      foo[field] = value;
      x[idx] = foo;
    }
    setValues(x);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(
      'http://localhost:5000/api/groceries/v1/meals',
      {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({menu_id: menuId, name: mealName})
      }
    ).then(r => r.json())
      .then(meal => ({meal_id: meal.id}))
      .then(x => {
        const calls = values.map(value => {
          if (!ingredientIdMap[value.name]) {
            const { quantity, ...rest} = value
            return fetch(
              'http://localhost:5000/api/groceries/v1/ingredients',
              {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(rest)
              }).then(r => {
                return r.json()
              }).then(ingredient => {
                return {quantity, ingredient_id: ingredient.id}
              }).then(thing => {
                return fetch('http://localhost:5000/api/groceries/v1/meals-ingredients',
                  {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({meal_id: x.meal_id, ...thing})
                  }
                )
              }).then(r => r.json()).then(b => {
                setValues([]);
                setTextBoxes(0);
                // prob close modal
              })
          } else {
            return null
          }
        }).filter(v => v !== null)
        return Promise.all(calls);
      }).catch(e => console.error(e));
;
  }

  function getValue(idx, field) {
    let value = '';
    const item = values[idx];
    if (item && item[field]) {
      value = item[field];
    }
    return value;
  }

  const handleMealChange = e => {
    setMealName(e.target.value);
  }

  return (
    <div>
      <button onClick={handleAddClick}>add</button>
      <div>
        {[...Array(textBoxes).keys()].map(idx => {
          return (
            <div>
              <input name="meal-name" value={mealName} onChange={handleMealChange} type="text"/>
              <AutoComplete
                suggestions={allIngredients}
                onChange={e => handleChange(idx, e, 'name')}
                name={`new-ingredient-name-${idx}`}/>
              <input
                name={`new-ingredient-quantity-${idx}`}
                key={`new-ingredient-quantity-${idx}`}
                value={getValue(idx, 'quantity')}
                onChange={e => handleChange(idx, e.target.value, 'quantity')}
                type="text"/>
              <AutoComplete
                suggestions={allUnits}
                onChange={e => handleChange(idx, e, 'unit')}
                name={`new-ingredient-unit-${idx}`}/>
              <AutoComplete
                suggestions={allCategories}
                onChange={e => handleChange(idx, e, 'category')}
                name={`new-ingredient-category-${idx}`}/>
            </div>
          );
        })}
        <button onClick={handleSubmit}>save</button>
      </div>
    </div>
  );
}



function Modal({children}) {
  return (
    <div>
      <div className={styles.modal}>
        {children}
      </div>
      <div className={styles.modalOverlay}></div>
    </div>
  );
}

function AutoComplete({suggestions, onChange}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleChange = (e) => {
    const filtered = suggestions.filter(suggestion => suggestion.toLowerCase().startsWith(e.target.value.toLowerCase()));
    setFilteredSuggestions(filtered)
    setUserInput(e.target.value);
    setShowSuggestions(true);
    onChange(e.target.value);
  }

  const handleClick = (e) => {
    setUserInput(e.currentTarget.innerText);
    setFilteredSuggestions([]);
    setSelectedIndex(0);
    setShowSuggestions(false);
    onChange(e.currentTarget.innerText)
  }

  const handleKeyDown =(e) => {
    if (e.keyCode === 13) { // enter
      setUserInput(filteredSuggestions[selectedIndex]);
      setSelectedIndex(0);
      setShowSuggestions(false)
      onChange(filteredSuggestions[selectedIndex])
    } else if (e.keyCode === 38) { // up
      if (selectedIndex > 0) {
        setSelectedIndex(si => si - 1);
      }
    } else if (e.keyCode === 40) { // down
      if (selectedIndex < filteredSuggestions.length - 1) {
        setSelectedIndex(si => si + 1);
      }
    }
  }

  return (
    <div>
      <input type='text' name={name} onKeyDown={handleKeyDown} onChange={handleChange} value={userInput} />
      {showSuggestions && userInput && filteredSuggestions.length ?
       (<ul>
          {filteredSuggestions.map((fs, idx) => {
            const className = idx === selectedIndex ? styles.active : styles.inactive;
            return <li key={`${fs}-${idx}`} className={className} onClick={handleClick}>{fs}</li>
          })}
        </ul>) : null}
    </div>
  )
}

export function App() {
  return (<Router>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/menus/:menuId/meals" element={<Foo />} />
    </Routes>
  </Router>);
}

