
export interface FitnessMetric {
    date: string;
    steps: number;
    calories: number;
    distance: number;
    heartPoints: number;
}

export interface SleepSession {
    startTime: string;
    endTime: string;
    durationMinutes: number;
    efficiency?: number; // Simplified logic if available
}

const FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

export const fetchFitnessData = async (accessToken: string, startTimeMillis: number, endTimeMillis: number): Promise<FitnessMetric[]> => {
    const url = `${FIT_API_BASE}/dataset:aggregate`;

    const body = {
        aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.distance.delta' },
            { dataTypeName: 'com.google.heart_minutes' }
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day in ms
        startTimeMillis,
        endTimeMillis
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Fitness API Error:", response.status, err);
        if (response.status === 401) console.error("Token might be expired or invalid.");
        if (response.status === 403) console.error("Permissions missing. Check Google Cloud Console or Scopes.");
        throw new Error(`${response.status} ${response.statusText}: ${err}`);
    }

    const data = await response.json();
    return processBuckets(data.bucket);
};

export const fetchSleepData = async (accessToken: string, startTimeMillis: number, endTimeMillis: number): Promise<SleepSession[]> => {
    // Sleep is usually queried via sessions
    const url = `${FIT_API_BASE}/sessions?startTime=${new Date(startTimeMillis).toISOString()}&endTime=${new Date(endTimeMillis).toISOString()}&activityType=72`;
    // 72 is sleep

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch sleep data: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.session || []).map((session: any) => ({
        startTime: new Date(Number(session.startTimeMillis)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(Number(session.endTimeMillis)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: Math.round((Number(session.endTimeMillis) - Number(session.startTimeMillis)) / 60000)
    }));
};

const processBuckets = (buckets: any[]): FitnessMetric[] => {
    return buckets.map(bucket => {
        const date = new Date(Number(bucket.startTimeMillis)).toLocaleDateString();

        // Order matches aggregation request
        // 0: steps, 1: calories, 2: distance, 3: heart points
        const getVal = (idx: number, isFloat = false) => {
            const points = bucket.dataset[idx].point;
            if (points && points.length > 0) {
                const val = points[0].value[0]; // Usually value[0] is the primary
                return isFloat ? (val.fpVal || 0) : (val.intVal || 0);
            }
            return 0;
        };

        return {
            date,
            steps: getVal(0),
            calories: Math.round(getVal(1, true)),
            distance: Math.round(getVal(2, true)),
            heartPoints: Math.round(getVal(3, true)) // heart points often store as fpVal
        };
    });
};

export const fetchMockFitnessData = async (startDate: number, endDate: number): Promise<FitnessMetric[]> => {
    const days = 7;
    const metrics: FitnessMetric[] = [];

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate + i * 86400000);
        metrics.push({
            date: date.toLocaleDateString(),
            steps: Math.floor(Math.random() * (12000 - 4000) + 4000), // 4k-12k steps
            calories: Math.floor(Math.random() * (2500 - 1500) + 1500),
            distance: Math.floor(Math.random() * (8000 - 3000) + 3000),
            heartPoints: Math.floor(Math.random() * (60 - 10) + 10)
        });
    }
    return metrics;
};

export const fetchMockSleepData = async (startDate: number, endDate: number): Promise<SleepSession[]> => {
    const days = 7;
    const sessions: SleepSession[] = [];

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate + i * 86400000);
        // Random bedtime between 10PM and 1AM
        const bedtimeHour = 22 + Math.floor(Math.random() * 3);
        const bedtime = new Date(date);
        bedtime.setHours(bedtimeHour, 30, 0);

        // Random wake time between 6AM and 9AM
        const waketime = new Date(date);
        waketime.setDate(waketime.getDate() + 1); // Next day
        waketime.setHours(6 + Math.floor(Math.random() * 3), 0, 0);

        sessions.push({
            startTime: bedtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: waketime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: (waketime.getTime() - bedtime.getTime()) / 60000
        });
    }
    return sessions;
};
