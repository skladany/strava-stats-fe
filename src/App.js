import React, { useState, useEffect } from "react";
import "./App.css";
import testData from "./data/testData";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [mileageGoal, setMileageGoal] = useState(2020);
  const [currentMiles, setCurrentMiles] = useState(0);
  const [progressBar, setProgressBar] = useState("0%");

  const [weeklyMileageGoal, setWeeklyMileageGoal] = useState(40);
  const [currentWeeklyMiles, setCurrentWeeklyMiles] = useState(0);

  const currDayNumber = () => {
    const today = new Date();
    const day = Math.ceil(
      (today - new Date(today.getFullYear(), 0, 1)) / 86400000
    );

    return day;
  };

  const daysLeft = () => {
    const today = new Date();
    const day = Math.floor(
      (new Date(today.getFullYear() + 1, 0, 1) - today) / 86400000
    );

    return day;
  };

  const goalPace = () => {
    // Ideal Pace
    const milesPerDay = mileageGoal / (currDayNumber() + daysLeft());
    const goalPace = currDayNumber() * milesPerDay;

    return goalPace.toFixed(2);
  };

  const currPace = () => {
    return (goalPace() - currentMiles).toFixed(2);
  };

  const milesPerDay = () => {
    return parseFloat((mileageGoal - currentMiles) / daysLeft()).toFixed(2);
  };

  const metersToMiles = (meters) => {
    return (meters * 0.000621371).toFixed(2);
  };

  // Get the start of the week, given the current date
  // https://www.w3resource.com/javascript-exercises/javascript-date-exercise-50.php
  const startOfWeek = (date) => {
    const day = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

    date.setDate(day);
    date.setHours(0, 0, 0, 0);

    return new Date(date);
  };

  const toggleMileage = (mile) => {
    const weeklyGoal =
      weeklyMileageGoal + mile > 0 ? weeklyMileageGoal + mile : 0;
    setWeeklyMileageGoal(weeklyGoal);
    localStorage.setItem("weeklyGoal", weeklyGoal);
  };

  useEffect(() => {
    const loadLocalStorage = () => {
      const weeklyGoal = parseInt(localStorage.getItem("weeklyGoal")) || 40;
      setWeeklyMileageGoal(weeklyGoal);
    };

    const fetchData = async () => {
      const endpoint = `https://tranquil-garden-10879.herokuapp.com`;
      //const endpoint = `http://localhost:7777`;

      let page = 1;
      let runData = [];

      if (process.env.NODE_ENV === "development") {
        runData = testData;
      } else {
        while (true) {
          const data = await fetch(
            `${endpoint}/strava/distance_run?page=${page}&per_page=50`
          ).then((r) => r.json());

          if (data.length < 1) {
            break;
          }

          runData = [...runData, ...data];

          page++;
        } // end while
      }

      // Parse the data
      const distance = runData.reduce((totalDistance, { distance }) => {
        return totalDistance + distance;
      }, 0);
      setCurrentMiles(metersToMiles(distance));

      const today = new Date();
      const monday = startOfWeek(today);

      const thisWeek = runData
        .filter(({ start_date }) => {
          // @todo this is UTC time, need to account for timezones eventually
          // ...but generally close enough for now
          const activityDate = new Date(start_date);

          return activityDate > monday;
        })
        .reduce((totalDistance, { distance }) => {
          return totalDistance + distance;
        }, 0);
      setCurrentWeeklyMiles(metersToMiles(thisWeek));

      const subwayStart = new Date(2020, 5, 3); // 0-index month!
      const subwayMiles = runData
        .filter(({ start_date }) => {
          // @todo this is UTC time, need to account for timezones eventually
          // ...but generally close enough for now
          const activityDate = new Date(start_date);

          return activityDate > subwayStart;
        })
        .reduce((totalDistance, { distance }) => {
          return totalDistance + distance;
        }, 0);

      setIsLoading(false);
    }; // end if/else

    loadLocalStorage();
    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      let progress = ((currentMiles / mileageGoal) * 100).toFixed(2);
      setProgressBar(`${progress}%`);
    }, 1000);
  }, [currentMiles]);

  return isLoading ? (
    <div className="App">
      <h1>🦄 Ashley Runs the World! 🏃‍♀️</h1>
      <img src="/loading.gif" />
    </div>
  ) : (
    <div className="App">
      <h1>🦄 Ashley Runs the World! 🏃‍♀️</h1>
      <div className="progress-bar subway">
        <div className="bar" style={{ width: progressBar }}></div>
        <p>
          <strong>{currentMiles}</strong> of <strong>{mileageGoal}</strong> 🏁
          miles.
        </p>
      </div>
      <p>
        You are <strong>{currPace()}</strong> miles off your yearly goal pace of{" "}
        <strong>{goalPace()}</strong>.
      </p>
      <p>
        You have <strong>{daysLeft()}</strong> days left to hit your goal!
      </p>
      <p>
        Run <strong>{milesPerDay()}</strong> miles a day to hit your goal!
      </p>
      <p>&hellip;</p>
      <p>
        <strong>{currentWeeklyMiles}</strong> of{" "}
        <strong>{weeklyMileageGoal}</strong> weekly miles.
        <br />
        <strong>
          {parseFloat(weeklyMileageGoal - currentWeeklyMiles).toFixed(2)}
        </strong>{" "}
        to go!!!
      </p>
      <div className="toggles">
        <button onClick={() => toggleMileage(-1)}>👇</button>
        <button onClick={() => toggleMileage(1)}>👆</button>
      </div>
    </div>
  );
}

export default App;
