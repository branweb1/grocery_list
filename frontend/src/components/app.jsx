import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Outlet } from 'react-router-dom';
import { Menus } from './menus.jsx';

async function fetchMenu(menuId) {
  return await fetch(`/api/groceries/v1/menus/${menuId}`).then(r => r.json())
}

async function fetchMealsForMenu(menuId) {
  const response = await fetch(`/api/groceries/v1/menus/${menuId}/meals`);
  const meals = await response.json();
  return meals
}

async function fetchMeals() {
  const response = await fetch('/api/groceries/v1/meals');
  const meals = await response.json();
  return meals;
}

async function deleteMealFromMenu(mealId) {
  const response = await fetch(`/api/groceries/v1/meals/${mealId}/menus`, {method: 'DELETE'});
  const msg = await response.json();
  return msg;
}

async function deleteMeal(mealId) {
  const response = await fetch(`/api/groceries/v1/meals/${mealId}`, {method: 'DELETE'});
  const msg = await response.json();
}

async function createMeal(mealName) {
  const meal = await fetch(
    '/api/groceries/v1/meals',
    {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name: mealName})
    }).then(r => r.json());

  return meal;
}

async function createIngredient(info) {
  return fetch(
    '/api/groceries/v1/ingredients',
    {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(info)
    }).then(r => {
      return r.json()
    });
}

async function createIngredientsBatch(ingredients) {
  if (ingredients.length < 1) {
    return Promise.resolve([]);
  }
  return fetch(
    '/api/groceries/v1/ingredients/batch',
    {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(ingredients)
    }).then(r => {
      return r.json()
    });
}

async function addIngredientsToMeal(mealId, ingredients) {

  return fetch(
    '/api/groceries/v1/meals-ingredients/batch',
    {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({meal_id: mealId, ingredients})
    }
  ).then(r => r.json());
}

async function updateIngredientsforMeal(mealId, ingredients) {

  return fetch(
    '/api/groceries/v1/meals-ingredients/batch',
    {
      method: 'PUT',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({meal_id: mealId, ingredients})
    }
  ).then(r => r.json());
}

function Home() {
  return (
    <div className={styles.container}>
      <header>
        <h3>
          <Link to="">Grocery List</Link>
        </h3>
      </header>
      <Outlet />
    </div>
  );
}

// function addMealToMenus(mealId, menuId) {
//   // put to meals/${mealId}/menus/${menuId}
// }

function Menu() {
  const { menuId } = useParams();
  const [mealsOnMenu, setMealsOnMenu] = useState([]);
  const [mealsNotOnMenu, setMealsNotOnMenu] = useState([]);
  const [modal, showModal] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [modalPage, setModalPage] = useState('');
  const [menu, setMenu] = useState(null);
  const [menuFilter, setMenuFilter] = useState('');

  useEffect(() => {
    fetchMenu(menuId).then(menu => setMenu(menu));
  }, []);

  useEffect(() => {
    Promise.all([fetchMeals(), fetchMealsForMenu(menuId)]).then(results => {
      const [allMeals, mealsOnMenu] = results;
      const menuMealIds = mealsOnMenu.map(m => m.id);
      const mealsNotOnMenu = allMeals.filter(m => !menuMealIds.includes(m.id))
      setMealsNotOnMenu(mealsNotOnMenu);
      setMealsOnMenu(mealsOnMenu);
    });
  }, []);

  const handleMealClick = (meal) => {
    return fetch(
      `/api/groceries/v1/meals/${meal.id}/menus/${menuId}`,
      {method: 'PUT'}
    ).then(() => {
      setMealsOnMenu(meals => [...meals, meal]);
      setMealsNotOnMenu(mealsNotOnMenu => mealsNotOnMenu.filter(m => m.id !== meal.id))
      showModal(false);
    })
  }

  const displayAllMeals = () => {
    let x = mealsNotOnMenu;
    if (menuFilter) {
      x = mealsNotOnMenu.filter(meal =>
        meal.name.toLowerCase().startsWith(menuFilter.toLowerCase()));
    }
    return x;
  }

  const handleFilterChange = (e) => {
    setMenuFilter(e.target.value);
  }

  // TODO: this just breaks the association. We propbably want to be able to actually delete meals too
  const handleDeleteClick = (meal) => {
    deleteMealFromMenu(meal.id).then(() => {
      setMealsOnMenu(meals => meals.filter(m => m.id !== meal.id));
      setMealsNotOnMenu(meals => [...meals, meal]);
    });
  }

  const handleDeleteMeal = (mealId) => {
    if (window.confirm('are you sure?')) {
      deleteMeal(mealId).then(() => {
        setMealsNotOnMenu(meals => meals.filter(m => m.id !== mealId));
        showModal(false);
      });
    }
  }

  const handleToggleModal = (meal) => {
    setCurrentMeal(meal);
    setModalPage('existingMeal');
    showModal(true);
  }

  const handleCloseClick = () => showModal(false);

  const handleAddMeal = () => {
    setModalPage('newMeal');
    showModal(true); 
  }

  const sortMealsAlpha = (a, b) => {
    if(a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
  }

  const getModalBody = (meal) => {
    switch(modalPage) {
      case 'newMeal':
        return (
          <OtherModalBody
            menuId={menuId}
            closeModal={() => showModal(false)}
            setMealsNotOnMenu={setMealsNotOnMenu}
          />
        );
      case 'existingMeal':
        return (<ModalBody
                  handleAdd={() => handleMealClick(meal)}
                  handleDelete={() => handleDeleteMeal(meal.id)}
		  handleEdit={() => setModalPage('editMeal')}
                  meal={meal}/>);
      case 'editMeal':
        return (<EditModalBody setModalPage={setModalPage} meal={meal} />)
      default:
        return null;
    }
  }


  return (
     <div className={styles.menu}>
       { menu && <h5 className="subheader">{`Menu ${menu.name}`}</h5>}
       <a href={`/api/groceries/v1/menus/${menuId}/shopping_list`}>
       <button>Download Shopping List</button>
       </a>
       <div className={styles.foo}>
       <section>
         {!!mealsOnMenu.length ? <ul>
           {mealsOnMenu.map(meal =>
             <li key={meal.id}>
               {meal.name}
               <button className={styles.closeButton} onClick={() => handleDeleteClick(meal)}>[X]</button>
             </li>
           )}
            </ul> : <div>No meals in this menu yet.</div>}
       </section>
       <section>
         <button className={styles.newMealButton} onClick={handleAddMeal}>+ Add New Meal</button>
         <label className={styles.filterLabel} htmlFor="menu-filter">filter meals:</label>
         <input name="menu-filter" type="text" onChange={handleFilterChange}/>
         <ul className={styles.mealsList}>
          {displayAllMeals(mealsNotOnMenu).sort(sortMealsAlpha).map(meal =>
            <li key={`${meal.id}-foo`}>
              <span onClick={() => handleToggleModal(meal)}>{meal.name}</span>
              <button className={styles.addButton} onClick={() => handleMealClick(meal)}>[+]</button>               
            </li>)}
         </ul>
      </section>
         </div>
      {modal && <Modal onCloseClick={handleCloseClick}>{getModalBody(currentMeal)}</Modal> }
    </div>
  );
}

async function fetchIngredientsForMeal(mealId) {
  const response = await fetch(`/api/groceries/v1/meals/${mealId}/ingredients`);
  const ingredients = response.json();
  return ingredients;
}

async function fetchAllIngredients() {
  const response = await fetch('/api/groceries/v1/ingredients');
  const ingredients = response.json();
  return ingredients;
}

async function fetchAllCategories() {
  const response = await fetch('/api/groceries/v1/ingredients/categories');
  const categories = response.json();
  return categories;
}

async function fetchAllUnits() {
  const response = await fetch('/api/groceries/v1/ingredients/units');
  const units = response.json();
  return units;
}

function ModalBody({meal, handleAdd, handleDelete, handleEdit}) {
  const { id: mealId, name: mealName } = meal;
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

  // TODO: make these editable
  return (
    <div>
      <h5 className={styles.modalHeader}>{mealName}</h5>
      <ul>
        {
          ingredients.map(i =>
            <li key={`${i.id}-${i.name}`}>
              {i.name} {i.quantity} {i.unit}
            </li>)
        }
      </ul>
      <button onClick={handleDelete}>delete meal</button>
      <button onClick={handleAdd}>add to menu</button>
      <button onClick={handleEdit}>edit meal</button>
    </div>
  );
}

function EditModalBody({meal, setModalPage}) {
  const { id: mealId, name: mealName } = meal;
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    fetchIngredientsForMeal(mealId).then(ingredients => {
      setIngredients(ingredients.map(i => ({...i, updated: false})))
    })
  }, []);

  function getValue(idx, field) {
    let value = '';
    const item = ingredients[idx];
    if (item && item[field]) {
      value = item[field];
    }
    return value;
  }


  const handleChange = (idx, value, field) => {
    const newIngredients = [...ingredients];
    const item = newIngredients[idx];
    if (item) {
      newIngredients[idx] = {...item, updated: true, [field]: value};
      setIngredients(newIngredients);
    }
  }

  const handleSubmit = async e => {
    e.preventDefault();
    updateIngredientsforMeal(mealId, ingredients.filter(i => i.updated === true))
      .then(r => setModalPage('existingMeal'))
      .catch(err => console.error(err));
  }
  
  return (
    <div>
      <h5 className={styles.modalHeader}>{mealName}</h5>
      <form onSubmit={handleSubmit}>
        {
          ingredients.map((i, idx) =>
	    <div key={`${i.id}-ingredient`}>
            <input
	      key={`${i.id}-${i.name}-${idx}`}
	      name={`ingredient-name-${idx}`}
	      value={getValue(idx, 'name')}
	      onChange={e => handleChange(idx, e.target.value, 'name')}/>
            <input
	      key={`${i.id}-quantity-${idx}`}
	      name={`ingredient-quantity-${idx}`}
	      value={getValue(idx, 'quantity')}
	      onChange={e => handleChange(idx, e.target.value, 'quantity')}/>
            <input
	      key={`${i.id}-unit-${idx}`}
	      name={`ingredient-unit-${idx}`}
	      value={getValue(idx, 'unit')}
	      onChange={e => handleChange(idx, e.target.value, 'unit')}/> 
	      </div>
	  )
        }
	<input type="submit" value="submit"/>

      </form>
    </div>
  );
}

function OtherModalBody({menuId, closeModal, setMealsNotOnMenu}) {
  const [textBoxes, setTextBoxes] = useState(1);
  const [values, setValues] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredientNameToIdMap, setIngredientNameToIdMap] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [mealName, setMealName] = useState('');

  useEffect(() => {
    fetchAllIngredients().then(is => {
      setAllIngredients(is.map(i => i.name));
      setIngredientNameToIdMap(is.reduce((acc, i) => {
        return {...acc, [i.name]: i}
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

  // returns [existing, new]
  function divideThings(is, f) {
    return is.reduce((acc, a) => {
      if (f(a)) {
        acc[0] = [...acc[0], a];
      } else {
        acc[1] = [...acc[1], a];
      }
      return acc;
    }, [[], []]);
  }

  const handleChange = (idx, value, field) => {
    const ingredients = [...values]
    const item = ingredients[idx];
    if (item) {
      ingredients[idx] = {...item, [field]: value};
      if (field === 'name') {
        const existingIngredient = ingredientNameToIdMap[value];
        if (existingIngredient) {
          ingredients[idx] = {
            ...item,
            name: existingIngredient.name,
            category: existingIngredient.category,
            unit: existingIngredient.unit
          }
        }
      }
    } else {
      const ingredient = {};
      ingredient[field] = value;
      ingredients[idx] = ingredient;
    }
    setValues(ingredients);
  }

  function divideIngredients(xs, map) {
    const newIngredients = [];
    const existingIngredients = [];
    xs.forEach(x => {
      if (ingredientNameToIdMap[x.name]) {
        existingIngredients.push({...x, id: ingredientNameToIdMap[x.name].id});
      } else {
        newIngredients.push(x);
      }
    });
    return [existingIngredients, newIngredients];
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameToQuantityMap = values.reduce((acc, a) => {
      return ({...acc, [a.name]: a.quantity});
    }, {});

    const [existingIngredients, newIngredients] = divideIngredients(values).map(is =>
      is.map(i => {
        const {quantity, ...rest} = i;
        return rest; 
      }));

    createMeal(mealName).then(meal => {
      return createIngredientsBatch(newIngredients).then(createdIngredients => {
        const ingredientsForMeal = [...createdIngredients, ...existingIngredients].map(ing => {
          return ({quantity: nameToQuantityMap[ing.name], id: ing.id});
        });

        return addIngredientsToMeal(meal.id, ingredientsForMeal).then(() => {
          setValues([]);
          setTextBoxes(1);
          closeModal();
          setMealsNotOnMenu(meals => [...meals, meal]);
        });
      });
    });
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

  const handleNameSelect = (name, idx) => {
    const ing = ingredientNameToIdMap[name];
    // if known ingredient
    if (ing) {
      const foo = [...values];
      const item = foo[idx]
      if (item) {
        foo[idx] = {...item, name: ing.name, category: ing.category, unit: ing.unit}
        setValues(foo)
      }
    }
  }

  return (
    <div className={styles.newMealForm}>
      <div className={styles.mealNameInput}>
        <label htmlFor="meal-name">Meal Name</label>
        <input name="meal-name" value={mealName} onChange={handleMealChange} type="text"/>
      </div>
      <table>
        <thead>
          <tr>
            <th>
              Ingredient Name
            </th>
            <th>
              Quantity
            </th>
            <th>
              Unit (optional)
            </th>
            <th>
              Category
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(textBoxes).keys()].map(idx =>
            <tr key={idx}>
              <td>
                <AutoComplete
                  suggestions={allIngredients}
                  onChange={e => handleChange(idx, e, 'name')}
                  fallbackValue={getValue(idx, 'name')}
                  name={`new-ingredient-name-${idx}`}/>
              </td>
              <td>
                <input
                  name={`new-ingredient-quantity-${idx}`}
                  key={`new-ingredient-quantity-${idx}`}
                  value={getValue(idx, 'quantity')}
                  onChange={e => handleChange(idx, e.target.value, 'quantity')}
                  type="text"/>
              </td>
              <td>
                <AutoComplete
                  suggestions={allUnits}
                  fallbackValue={getValue(idx, 'unit')}
                  onChange={e => handleChange(idx, e, 'unit')}
                  name={`new-ingredient-unit-${idx}`}/>
              </td>
              <td>
                <AutoComplete
                  suggestions={allCategories}
                  fallbackValue={getValue(idx, 'category')}
                  onChange={e => handleChange(idx, e, 'category')}
                  name={`new-ingredient-category-${idx}`}/>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={handleAddClick}>Add Ingredient</button>
      <button className={styles.saveButton} onClick={handleSubmit}>save</button>
    </div>
  );
}



function Modal({children, onCloseClick}) {
  return (
    <div>
      <div className={styles.modal}>
        <button className={styles.modalCloseButton} onClick={onCloseClick}>[X]</button>
        {children}
      </div>
      <div className={styles.modalOverlay}></div>
    </div>
  );
}

function AutoComplete({suggestions, onChange, fallbackValue}) {
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
      onChange(filteredSuggestions[selectedIndex])
      setSelectedIndex(0);
      setShowSuggestions(false)
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
    <span className={styles.autoCompleteContainer}>
      <input type='text' name={name} onKeyDown={handleKeyDown} onChange={handleChange} value={fallbackValue} />
      {showSuggestions && userInput && filteredSuggestions.length ?
       (<ul>
          {filteredSuggestions.map((fs, idx) => {
            const className = idx === selectedIndex ? styles.active : styles.inactive;
            return <li key={`${fs}-${idx}`} className={className} onClick={handleClick}>{fs}</li>
          })}
        </ul>) : null}
    </span>
  )
}

function Test() {
  return (<div>hi<Outlet/></div>)
}

function Subpage() {
  return (<div>i am the subpage</div>);
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}>
          <Route path="/" element={<Menus/>}/>
          <Route path="menus/:menuId/meals" element={<Menu/>} />
        </Route>  
      </Routes>
    </Router>
  );
}



