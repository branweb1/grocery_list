import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Outlet } from 'react-router-dom';
import { Menus } from './menus.jsx';

async function fetchMenu(menuId) {
  return await fetch(`http://localhost:5000/api/groceries/v1/menus/${menuId}`).then(r => r.json())
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

async function deleteMealFromMenu(mealId) {
  const response = await fetch(`http://localhost:5000/api/groceries/v1/meals/${mealId}/menus`, {method: 'DELETE'});
  const msg = await response.json();
  return msg;
}

async function deleteMeal(mealId) {
  const response = await fetch(`http://localhost:5000/api/groceries/v1/meals/${mealId}`, {method: 'DELETE'});
  const msg = await response.json();
}

async function createMeal(mealName) {
  const meal = await fetch(
    'http://localhost:5000/api/groceries/v1/meals',
    {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({name: mealName})
    }).then(r => r.json());

  return meal;
}

async function createIngredient(info) {
  return fetch(
    'http://localhost:5000/api/groceries/v1/ingredients',
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
    'http://localhost:5000/api/groceries/v1/ingredients/batch',
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
    'http://localhost:5000/api/groceries/v1/meals-ingredients/batch',
    {
      method: 'POST',
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
          <Link to="http://localhost:5000">Grocery List</Link>
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
      `http://localhost:5000/api/groceries/v1/meals/${meal.id}/menus/${menuId}`,
      {method: 'PUT'}
    ).then(() => {
      setMealsOnMenu(meals => [...meals, meal]);
      setMealsNotOnMenu(mealsNotOnMenu => mealsNotOnMenu.filter(m => m.id !== meal.id))
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
      });
    }
  }

  const handleToggleModal = (mealId) => {
    setCurrentMeal(mealId);
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

  const getModalBody = (mealId) => {
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
        return (<ModalBody mealId={mealId}/>);
      default:
        return null;
    }
  }


  return (
     <div className={styles.menu}>
       { menu && <h5 className="subheader">{`Menu ${menu.name}`}</h5>}
       <a href={`http://localhost:5000/api/groceries/v1/menus/${menuId}/shopping_list`}>
       <button>Download Shopping List</button>
       </a>
       <div className={styles.foo}>
       <section>
         {!!mealsOnMenu.length ? <ul>
           {mealsOnMenu.map(meal =>
             <li key={meal.id}>
               <a href="#" onClick={() => handleToggleModal(meal.id)}>{meal.name}</a>
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
              <span onClick={() => handleMealClick(meal)}>{meal.name}</span>
              <button className={styles.closeButton} onClick={() => handleDeleteMeal(meal.id)}>[X]</button>
            </li>)}
         </ul>
      </section>
         </div>
      {modal && <Modal onCloseClick={handleCloseClick}>{getModalBody(currentMeal)}</Modal> }
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

  // TODO: make these editable
  return (<div>
    <ul>
      {ingredients.map(i => <li key={`${i.id}-${i.name}`}>{i.name} {i.quantity} {i.unit}</li>)}
    </ul>
  </div>);
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
        return {...acc, [i.name]: i.id}
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
        existingIngredients.push({...x, id: ingredientNameToIdMap[x.name]});
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



//     createMeal().then(meal => {
//       const [existing, newVals] = divideThings(is, a => ingredientNameToIdMap[a.name]);
//       // create new
//       // associate all
//       const newWithIds = createNewIngredients(newVals)
//       associateWithMeal(meal, existing, ids)
      
      
//     })

//     fetch(
//       'http://localhost:5000/api/groceries/v1/meals',
//       {
//         method: 'POST',
//         headers: {"Content-Type": "application/json"},
//         body: JSON.stringify({name: mealName})
//       }
//     ).then(r => r.json())
//       .then(meal => {
//         const calls = values.map(value => {
//           // if not in map
//           //   create ingredient
//           //   do all the other stuff
//           // else
//           //   only do the other stuff

//           // TODO I think this causes a bug if you use an existing ingredient 
//           // it isn't associated with the meal and the modal cleanup stuff doesn't happen
//           // so you'd only want to create the ingredient conditionally
//           // everything else you'd do regardless of it being a new ingredient
//           if (!ingredientNameToIdMap[value.name]) {
//             const { quantity, ...rest} = value
//             return fetch(
//               'http://localhost:5000/api/groceries/v1/ingredients',
//               {
//                 method: 'POST',
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify(rest)
//               }).then(r => {
//                 return r.json()
//               }).then(ingredient => {
//                 return {quantity, ingredient_id: ingredient.id}
//               }).then(thing => {
//                 return fetch('http://localhost:5000/api/groceries/v1/meals-ingredients',
//                   {
//                     method: 'POST',
//                     headers: {"Content-Type": "application/json"},
//                     body: JSON.stringify({meal_id: meal.id, ...thing})
//                   }
//                 );
//               }).then(() => {
//                 setValues([]);
//                 setTextBoxes(1);
//                 closeModal();
//                 setMealsNotOnMenu(meals => [...meals, meal]);
//               })
//           } else {
//             return null
//           }
//         }).filter(v => v !== null)
//         return Promise.all(calls);
//       }).catch(e => console.error(e));
// ;
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

  // TODO if it's a known ingredient, we should be able to set the category and unit

  return (
    <div>
      <button onClick={handleAddClick}>add</button>
      <div className={styles.newMealForm}>
        <label htmlFor="meal-name">Meal Name</label>
        <input name="meal-name" value={mealName} onChange={handleMealChange} type="text"/>
        {[...Array(textBoxes).keys()].map(idx => {
          return (
            <div key={idx}>
              <label htmlFor={`new-ingredient-name-${idx}`}>Ingredient Name</label>
              <AutoComplete
                suggestions={allIngredients}
                onChange={e => handleChange(idx, e, 'name')}
                name={`new-ingredient-name-${idx}`}/>
              <label htmlFor={`new-ingredient-quantity-${idx}`}>Quantity</label>
              <input
                name={`new-ingredient-quantity-${idx}`}
                key={`new-ingredient-quantity-${idx}`}
                value={getValue(idx, 'quantity')}
                onChange={e => handleChange(idx, e.target.value, 'quantity')}
                type="text"/>
              <label htmlFor={`new-ingredient-unit-${idx}`}>Unit (optional)</label>
              <AutoComplete
                suggestions={allUnits}
                onChange={e => handleChange(idx, e, 'unit')}
                name={`new-ingredient-unit-${idx}`}/>
              <label htmlFor={`new-ingredient-category-${idx}`}>Category</label>
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
    <span className={styles.autoCompleteContainer}>
      <input type='text' name={name} onKeyDown={handleKeyDown} onChange={handleChange} value={userInput} />
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



