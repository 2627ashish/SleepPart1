import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
};

const useHealthData = (date: Date) => {
  const [hasPermissions, setHasPermission] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setcalories] = useState(0);
  const [heartrate, setHeartRate] = useState(0);
  const [restingHeartRate, setRestingHeartRate] = useState(0);
  const [sleepDuration, setsleepDuration] = useState(0);
  const [oxygenSaturation, setOxygenSaturation] = useState(0);
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  // const [bloodPressure,setbloodPressure] = useState(0);

  // iOS - HealthKit
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    AppleHealthKit.isAvailable((err, isAvailable) => {
      if (err) {
        console.log('Error checking availability');
        return;
      }
      if (!isAvailable) {
        console.log('Apple Health not available');
        return;
      }
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          console.log('Error getting permissions');
          return;
        }
        setHasPermission(true);
      });
    });
  }, []);

  useEffect(() => {
    if (!hasPermissions) {
      return;
    }

    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        console.log('Error getting the steps');
        return;
      }
      setSteps(results.value);
    });

    AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
      if (err) {
        console.log('Error getting the steps:', err);
        return;
      }
      setDistance(results.value);
    });
  }, [hasPermissions, date]);

  // Android - Health Connect
  const readSampleData = async () => {
    // initialize the client
    const isInitialized = await initialize();
    if (!isInitialized) {
      return;
    }

    // request permissions
    await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'RestingHeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'OxygenSaturation' },
      { accessType: 'read', recordType: 'Height' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' }
      // { accessType: 'read', recordType: 'BloodPressure'},
    ]);

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), // Start of the specified date
      endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString(), // End of the specified date
    };


    //time range filter for the height and weight
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const past90DaysFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: startDate.toISOString(),
      endTime: new Date().toISOString(),
    };
    // Steps
    const steps = await readRecords('Steps', { timeRangeFilter });
    const totalSteps = steps.reduce((sum, cur) => sum + cur.count, 0);
    setSteps(totalSteps);

    // Distance
    const distance = await readRecords('Distance', { timeRangeFilter });
    const totalDistance = distance.reduce(
      (sum, cur) => sum + cur.distance.inMeters,
      0
    );
    setDistance(totalDistance);

    //total calories burned
    const caloriesBurned = await readRecords('TotalCaloriesBurned', {
      timeRangeFilter,
    });
    const totalclaoriesburned = caloriesBurned.reduce((sum, cur) => sum + cur.energy.inKilocalories, 0);
    console.log("caloried Burned Total:", totalclaoriesburned);
    setcalories(totalclaoriesburned);
    //Active calories burned
    // const caloriesBurned = await readRecords('ActiveCaloriesBurned', {
    //   timeRangeFilter,
    // });
    // const totalclaoriesburned = caloriesBurned.reduce((sum, cur) => sum + cur.energy.inCalories, 0);
    // setcalories(totalclaoriesburned);
    //heartrate
    const heartRate = await readRecords('HeartRate', {
      timeRangeFilter,
    });
    const totalHeartRate = heartRate.reduce((sum, cur) => {
      return sum + cur.samples.reduce((sampleSum, sample) => {
        return sampleSum + sample.beatsPerMinute;
      }, 0);
    }, 0);
    console.log("Total Heart Rate:", totalHeartRate);
    setHeartRate(totalHeartRate);
    //resting hearrate
    const restheartrate = await readRecords('RestingHeartRate', {
      timeRangeFilter: past90DaysFilter,
    });
    const totalRestingHeartRate = restheartrate.reduce((sum, cur) => {
      return sum + cur.beatsPerMinute;
    }, 0);
    setRestingHeartRate(totalRestingHeartRate);

    //total time slept
    const sleepDuration = await readRecords('SleepSession', {
      timeRangeFilter,
    });

    // Check if sleep duration data is available
    if (sleepDuration.length === 0) {
      console.log("No sleep session data available for the specified time range.");
    } else {
      // Calculate total sleep duration
      const totalSleepDuration = sleepDuration.reduce((sum, cur) => {
        // Check if stages array exists and is not empty
        if (cur.stages && cur.stages.length > 0) {
          return sum + cur.stages.reduce((stageSum, stage) => {
            // Calculate duration for each sleep stage
            const startTime = new Date(stage.startTime);
            const endTime = new Date(stage.endTime);
            const durationInMilliseconds = endTime.getTime() - startTime.getTime();
            // Convert duration to hours (or any other desired unit)
            const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
            return stageSum + durationInHours;
          }, 0);
        } else {
          // If stages array is undefined or empty, return sum without adding anything
          return sum;
        }
      }, 0);

      console.log("Total Sleep Duration:", totalSleepDuration);
      setsleepDuration(totalSleepDuration);
      // Set total sleep duration as needed (e.g., update state)
    }

    //oxygen Saturation
    const oxygensaturation = await readRecords('OxygenSaturation', {
      timeRangeFilter,
    });
    const totalOxygenSaturation = oxygensaturation.reduce((sum, cur) => {
      return sum + cur.percentage;
    }, 0);
    setOxygenSaturation(totalOxygenSaturation);

    //Height
    const heightlevel = await readRecords('Height', {
      timeRangeFilter: past90DaysFilter,
    });
    const totalHeight = heightlevel.reduce((sum, cur) => {
      return sum + cur.height.inMeters;
    }, 0);
    setHeight(totalHeight);

    //weight
    const weightlevel = await readRecords('Weight', {
      timeRangeFilter,
    });
    const totalweight = weightlevel.reduce((sum, cur) => {
      return sum + cur.weight.inKilograms;
    }, 0);
    console.log(totalweight);
    setWeight(totalweight);


    //blood pressure
    // const bloodPressure=await readRecords('BloodPressure',{
    //   timeRangeFilter,
    // });
    // const totalBp = bloodPressure;
    // setbloodPressure(totalBp);
    // console.log(floorsClimbed);
  };

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    readSampleData();
  }, [date]);

  return {
    steps,
    distance,
    calories,
    heartrate,
    restingHeartRate,
    sleepDuration,
    oxygenSaturation,
    height,
    weight
  };
};

export default useHealthData;
