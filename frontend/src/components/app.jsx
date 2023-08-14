import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

async function fetchMenus() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/menus');
  const menus = await response.json();
  return menus;
}

function Home() {
  const [menus, setMenus] = useState([]);
  useEffect(() => {
    fetchMenus().then(menus => {
      setMenus(menus);
    });
  }, []);

  return (
    <div className={styles.container}>
      <header>
        <h3>Grocery List</h3>
        <ul>
          {menus.map(menu => {
            return <Link to={`http://localhost:5000/menus/${menu.id}/meals`}><li>{menu.name}</li></Link>
          })}
        </ul>
      </header>
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
    toggleModal(!modal);
  }

  useEffect(() => {
    Promise.all([fetchMeals(), fetchMealsForMenu(menuId)]).then(xs => {
      const [meals, mealsForMenu] = xs;
      const menuMealIds = mealsForMenu.map(m => m.id);
      setAllMeals(meals.filter(m => !menuMealIds.includes(m.id)))
      setMeals(mealsForMenu)
    })
  }, []);

  return (
    <div>
      <ul>
        {meals.map(meal => <li key={meal.id}>
                             <a href="#" onClick={() => handleToggleModal(meal.id)}>{meal.name}</a>
                             <button onClick={() => handleDeleteClick(meal)}>delete</button>
                           </li>)}
      </ul>
      <hr/>
      <ul>
        {allMeals.map(meal => <li key={`${meal.id}-foo`} onClick={() => handleClick(meal)}>{meal.name}</li>)}
      </ul>
      {modal && <Modal mealId={currentMeal} /> }
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

function Modal({mealId}) {
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

  return (
    <div>
      <div className={styles.modal}>
        <ul>
          {ingredients.map(i => <li key={`${i.id}-${i.name}`}>{i.name} {i.quantity} {i.unit}</li>)}
        </ul>
        <AutoComplete suggestions={allIngredients}/>
      </div>
      <div className={styles.modalOverlay}></div>
    </div>
  );
}

function AutoComplete({suggestions}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleChange = (e) => {
    const filtered = suggestions.filter(suggestion => suggestion.toLowerCase().startsWith(e.target.value.toLowerCase()));
    setFilteredSuggestions(filtered)
    setUserInput(e.target.value);
    setShowSuggestions(true);
  }

  const handleClick = (e) => {
    setUserInput(e.currentTarget.innerText);
    setFilteredSuggestions([]);
    setSelectedIndex(0);
    setShowSuggestions(false);
  }

  const handleKeyDown =(e) => {
    if (e.keyCode === 13) { // enter
      setUserInput(filteredSuggestions[selectedIndex]);
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
    <div>
      <input type='text' onKeyDown={handleKeyDown} onChange={handleChange} value={userInput} />
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

