import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

async function fetchMenus() {
  const response = await fetch('http://localhost:3000/api/menus');
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
            return <Link to={`http://localhost:3000/menus/${menu.id}/meals`}><li>{menu.name}</li></Link>
          })}
        </ul>
      </header>
    </div>
  );
}

async function fetchMealsForMenu(menuId) {
  const response = await fetch(`http://localhost:3000/api/menus/${menuId}/meals`);
  const meals = await response.json();
  return meals
}

async function fetchMeals() {
  const response = await fetch('http://localhost:3000/api/meals');
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

  const handleClick = (meal) => {
    console.log('mealname', meal)
    console.log('updating meals')
    setMeals(meals => [...meals, meal]);
  }

  useEffect(() => {
    fetchMeals().then(meals => setAllMeals(meals));
  }, []);

  useEffect(() => {
    fetchMealsForMenu(menuId).then(meals => setMeals(meals))
  }, []);

  return (
    <div>
      <ul>
        {meals.map(meal => <li key={meal.id}>{meal.name}</li>)}
      </ul>
      <hr/>
      <ul>
        {allMeals.map(meal => <li key={`${meal.id}-foo`} onClick={() => handleClick(meal)}>HEY{meal.name}</li>)}
      </ul>
    </div>
  );
}

export function App() {
  return (<Router>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/menus/:menuId/meals" element={<Foo />} />
    </Routes>
  </Router>);
}
