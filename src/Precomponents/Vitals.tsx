import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Value from './value';
import RingProgress from './RingProgress';
import { useState } from 'react';
import useHealthData from '../hooks/useHealthData';
import { AntDesign } from '@expo/vector-icons';

const STEPS_GOAL = 10_000;

export default function VitalsScreen() {
    const [date, setDate] = useState(new Date());
    const { steps, distance, calories, heartrate, restingHeartRate,
        sleepDuration,
        oxygenSaturation,
        height,
        weight } = useHealthData(date);

    const changeDate = (numDays: number) => {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + numDays);
        setDate(currentDate);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.datePicker}>
                    <AntDesign
                        onPress={() => changeDate(-1)}
                        name="left"
                        size={20}
                        color="#C3FF53"
                    />
                    <Text style={styles.date}>{date.toDateString()}</Text>
                    <AntDesign
                        onPress={() => changeDate(1)}
                        name="right"
                        size={20}
                        color="#C3FF53"
                    />
                </View>

                <RingProgress radius={150} strokeWidth={50} progress={steps / STEPS_GOAL} />

                <View style={styles.values}>
                    <Value label="Steps" value={steps.toString()} />
                    <Value label="Distance" value={`${(distance / 1000).toFixed(2)} km`} />
                    <Value label="Calories Burned" value={`${calories.toFixed(2)} kcal`} />
                    <Value label="Heart Rate" value={`${(heartrate / 100).toFixed(2)} bpm`} />
                    <Value label="Resting Heart Rate" value={`${restingHeartRate.toFixed(2)} bpm`} />
                    <Value label="Sleep Time" value={`${sleepDuration.toFixed(3)} Hr`} />
                    <Value label="Oxygen Saturation" value={`${oxygenSaturation.toFixed(3)} %`} />
                    <Value label="Height" value={`${(height * 100).toFixed(2)} cm`} />
                    <Value label="Weight" value={`${(weight).toFixed(2)} Kg`} />
                </View>

                <StatusBar style="auto" />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        backgroundColor: 'black',
        padding: 10
    },
    values: {
        flexDirection: 'row',
        gap: 25,
        flexWrap: 'wrap',
        marginTop: 100,
    },
    datePicker: {
        alignItems: 'center',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    date: {
        color: 'white',
        fontWeight: '500',
        fontSize: 20,
        marginHorizontal: 20,
    },
});
