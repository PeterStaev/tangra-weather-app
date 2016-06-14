import observable = require("data/observable");
import * as moment from "moment";

interface ICurrentConditionIcon {
    icon1: { text: string, color: string };
    icon2: { text: string, color: string };
    fontSize: number;
}

interface IUnitSymbol {
    pressure: string;
    windSpeed: string;
}

interface IHourlyData {
    time: Date;
    temperature: number;
    humidity: number;
    precipProbability: number;
    precipIntensity: number;
}

let currentConditionIcons: { [condition: string]: ICurrentConditionIcon } = {
    "clear-day": {
        icon1: { text: "\uf113", color: "#FFA500" },
        icon2: { text: "", color: "" },
        fontSize: 80
    },
    "clear-night": {
        icon1: { text: "\uf10d", color: "#FFA500" },
        icon2: { text: "", color: "" },
        fontSize: 90
    },
    "rain": {
        icon1: { text: "\uf105", color: "#DDDDDD" },
        icon2: { text: "\uf107", color: "#4681C3" },
        fontSize: 90
    },
    "snow": {
        icon1: { text: "\uf105", color: "#DDDDDD" },
        icon2: { text: "\uf10b", color: "#acd3f3" },
        fontSize: 90
    },
    "sleet": {
        icon1: { text: "\uf105", color: "#DDDDDD" },
        icon2: { text: "\uf10c", color: "#acd3f3" },
        fontSize: 90
    },
    "wind": {
        icon1: { text: "\uf105", color: "#DDDDDD" },
        icon2: { text: "\uf115", color: "#DDDDDD" },
        fontSize: 90
    },
    "fog": {
        icon1: { text: "\uf108", color: "#CCCCCC" },
        icon2: { text: "", color: "" },
        fontSize: 80
    },
    "cloudy": {
        icon1: { text: "\uf106", color: "#DDDDDD" },
        icon2: { text: "", color: "" },
        fontSize: 80
    },
    "partly-cloudy-day": {
        icon1: { text: "\uf106", color: "#DDDDDD" },
        icon2: { text: "\uf101", color: "#FFA500" },
        fontSize: 90
    },
    "partly-cloudy-night": {
        icon1: { text: "\uf106", color: "#DDDDDD" },
        icon2: { text: "\uf100", color: "#FFA500" },
        fontSize: 90
    }
};

let units: { [unitSystem: string]: IUnitSymbol } = {
    "us": {
        pressure: "mb",
        windSpeed: "mph"
    },
    "si": {
        pressure: "HPa",
        windSpeed: "m/s"
    }
};

let conditionIcons: { [condition: string]: string } = {
    "clear-day": "\uf00d",
    "clear-night": "\uf02e",
    "rain": "\uf019",
    "snow": "\uf01b",
    "sleet": "\uf0b5",
    "wind": "\uf050",
    "fog": "\uf014",
    "cloudy": "\uf013",
    "partly-cloudy-day": "\uf002",
    "partly-cloudy-night": "\uf086"
};

export class WeatherDashboardModel extends observable.Observable {
    private _rawData: any;

    constructor() {
        super();
        this.set("currentTemperature", "-");
        this.set("unitSystem", "us");
        this.set("selectedChartIndex", 0);
    }

    public loadRawData(lat: number, lon: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // TODO;
            this._rawData = data;
            setTimeout(() => resolve(), 3000);
        });
    }

    public switchUnitSystem() {
        this.set("unitSystem", this.get("unitSystem") === "us" ? "si" : "us");
    }
    public loadWeatherData() {
        let data = this._rawData;
        let unitSystem = this.get("unitSystem");
        let currentConditionIcon: ICurrentConditionIcon = currentConditionIcons[data.currently.icon];
        let unitSymbol: IUnitSymbol = units[unitSystem];
        let currentDailyData = data.daily.data[0];

        this.set("currentCondition", data.currently.icon);
        if (currentConditionIcon) {
            this.set("conditionIcon1Text", currentConditionIcon.icon1.text);
            this.set("conditionIcon1Color", currentConditionIcon.icon1.color);
            this.set("conditionIcon2Text", currentConditionIcon.icon2.text);
            this.set("conditionIcon2Color", currentConditionIcon.icon2.color);
            this.set("conditionFontSize", currentConditionIcon.fontSize);
        }
        this.set("currentTemperature", Math.round(data.currently.temperature));
        this.set("currentConditionSummary", data.currently.summary);
        this.set("currentHumidity", `${data.currently.humidity * 100} %`);
        this.set("currentPressure", `${data.currently.pressure} ${unitSymbol.pressure}`);
        this.set("currentWindSpeed", `${data.currently.windSpeed} ${unitSymbol.windSpeed}`);
        this.set("currentWindBearing", data.currently.windBearing);
        this.set("sunriseTime", moment.unix(currentDailyData.sunriseTime).toDate());
        this.set("sunsetTime", moment.unix(currentDailyData.sunsetTime).toDate());
        this.set("moonPhaseText", this._getMoonPhaseText(currentDailyData.moonPhase));
        this.set("moonPhaseIcon", String.fromCharCode(61589 + Math.round(28 * currentDailyData.moonPhase)));
        this.set("daily", data.daily.data.map((item) => {
            return {
                day: moment.unix(item.time).toDate(),
                temperatureMin: Math.round(item.temperatureMin),
                temperatureMax: Math.round(item.temperatureMax),
                icon: conditionIcons[item.icon],
                humidity: item.humidity * 100,
                precipProbability: item.precipProbability * 100,
                precipIntensity: item.precipIntensity * (unitSystem === "us" ? 25.4 : 1)
            };
        }));
    }

    public filterHourlyData(dayIndex: number) {
        let secsPerDay = 24 * 60 * 60;
        let rawHourlyData = this._rawData.hourly.data;
        let currentDay = this.get("daily")[dayIndex].day as Date;
        let hourlyData: Array<IHourlyData>;
        let fromTime: number;
        let toTime: number;

        if (dayIndex === 0) {
            // For the first day we should set the from to the first available hourly data, so we can still get 24 hourly points
            fromTime = rawHourlyData[0].time;

        }
        else {
            fromTime = currentDay.getTime() / 1000; // Convert to Unix time
        }
        toTime = fromTime + secsPerDay;

        hourlyData =
            rawHourlyData
                .filter((item) => item.time >= fromTime && item.time < toTime)
                .map((item) => {
                    return {
                        time: moment.unix(item.time).toDate(),
                        temperature: Math.round(item.temperature),
                        humidity: item.humidity * 100,
                        precipProbability: item.precipProbability * 100,
                        precipIntensity: item.precipIntensity * (this.get("unitSystem") === "us" ? 25.4 : 1)
                    };
                });
        this.set("hourly", hourlyData);
        this.set("currentDay", currentDay);
    }

    private _getMoonPhaseText(moonPhase: number) {
        if (moonPhase === 0) {
            return "New\nMoon";
        }
        if (moonPhase < 0.25) {
            return "Waxing\nCrescent";
        }
        if (moonPhase === 0.25) {
            return "First\nQuarter";
        }
        if (moonPhase < 0.5) {
            return "Waxing\nGibbous";
        }
        if (moonPhase === 0.5) {
            return "Full\nMoon";
        }
        if (moonPhase < 0.75) {
            return "Waning\nGibbous";
        }
        if (moonPhase === 0.75) {
            return "Last\nQuarter"
        }
        if (moonPhase < 1) {
            return "Waning\nCrescent";
        }
    }
}

let data = { "latitude": 42.6833, "longitude": 23.3167, "timezone": "Europe/Sofia", "offset": 3, "currently": { "time": 1465420481, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0025, "precipProbability": 0.07, "precipType": "rain", "temperature": 50.8, "apparentTemperature": 50.8, "dewPoint": 47.03, "humidity": 0.87, "windSpeed": 2.81, "windBearing": 123, "visibility": 6.21, "cloudCover": 0.13, "pressure": 1017.76, "ozone": 364.11 }, "hourly": { "summary": "Drizzle starting tomorrow evening, continuing until tomorrow night.", "icon": "rain", "data": [{ "time": 1465419600, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0028, "precipProbability": 0.09, "precipType": "rain", "temperature": 51.27, "apparentTemperature": 51.27, "dewPoint": 47.43, "humidity": 0.87, "windSpeed": 2.81, "windBearing": 119, "visibility": 6.21, "cloudCover": 0.17, "pressure": 1017.78, "ozone": 363.95 }, { "time": 1465423200, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0017, "precipProbability": 0.04, "precipType": "rain", "temperature": 49.35, "apparentTemperature": 49.35, "dewPoint": 45.83, "humidity": 0.88, "windSpeed": 2.85, "windBearing": 133, "visibility": 6.21, "cloudCover": 0.03, "pressure": 1017.69, "ozone": 364.59 }, { "time": 1465426800, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0008, "precipProbability": 0.01, "precipType": "rain", "temperature": 46.58, "apparentTemperature": 45.76, "dewPoint": 43.38, "humidity": 0.89, "windSpeed": 3.05, "windBearing": 144, "visibility": 6.21, "cloudCover": 0.03, "pressure": 1017.59, "ozone": 365.22 }, { "time": 1465430400, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 46.32, "apparentTemperature": 45.17, "dewPoint": 43.39, "humidity": 0.89, "windSpeed": 3.36, "windBearing": 153, "visibility": 6.21, "cloudCover": 0.02, "pressure": 1017.49, "ozone": 365.86 }, { "time": 1465434000, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 49.53, "apparentTemperature": 48.57, "dewPoint": 46.91, "humidity": 0.91, "windSpeed": 3.68, "windBearing": 159, "visibility": 6.21, "cloudCover": 0.05, "pressure": 1017.34, "ozone": 366.06 }, { "time": 1465437600, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 49.77, "apparentTemperature": 48.61, "dewPoint": 47.45, "humidity": 0.92, "windSpeed": 4, "windBearing": 164, "visibility": 6.21, "cloudCover": 0.1, "pressure": 1017.16, "ozone": 366.1 }, { "time": 1465441200, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 49.86, "apparentTemperature": 48.57, "dewPoint": 47.09, "humidity": 0.9, "windSpeed": 4.2, "windBearing": 168, "cloudCover": 0.12, "pressure": 1016.95, "ozone": 366.39 }, { "time": 1465444800, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 50.88, "apparentTemperature": 50.88, "dewPoint": 46.37, "humidity": 0.84, "windSpeed": 4.23, "windBearing": 170, "cloudCover": 0.12, "pressure": 1016.71, "ozone": 367.5 }, { "time": 1465448400, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 52.8, "apparentTemperature": 52.8, "dewPoint": 45.59, "humidity": 0.76, "windSpeed": 4.05, "windBearing": 171, "cloudCover": 0.1, "pressure": 1016.43, "ozone": 368.86 }, { "time": 1465452000, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 55.19, "apparentTemperature": 55.19, "dewPoint": 45.1, "humidity": 0.69, "windSpeed": 3.6, "windBearing": 172, "cloudCover": 0.08, "pressure": 1016.11, "ozone": 369.21 }, { "time": 1465455600, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 58.68, "apparentTemperature": 58.68, "dewPoint": 45.56, "humidity": 0.62, "windSpeed": 2.78, "windBearing": 176, "cloudCover": 0.05, "pressure": 1015.71, "ozone": 367.77 }, { "time": 1465459200, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0008, "precipProbability": 0.01, "precipType": "rain", "temperature": 63.02, "apparentTemperature": 63.02, "dewPoint": 46.42, "humidity": 0.55, "windSpeed": 1.78, "windBearing": 185, "cloudCover": 0.03, "pressure": 1015.24, "ozone": 365.33 }, { "time": 1465462800, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0014, "precipProbability": 0.03, "precipType": "rain", "temperature": 67.37, "apparentTemperature": 67.37, "dewPoint": 47.51, "humidity": 0.49, "windSpeed": 0.91, "windBearing": 203, "cloudCover": 0.02, "pressure": 1014.72, "ozone": 363.01 }, { "time": 1465466400, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0021, "precipProbability": 0.05, "precipType": "rain", "temperature": 71.06, "apparentTemperature": 71.06, "dewPoint": 48.65, "humidity": 0.45, "windSpeed": 0.33, "windBearing": 272, "cloudCover": 0, "pressure": 1014.14, "ozone": 361.1 }, { "time": 1465470000, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0028, "precipProbability": 0.09, "precipType": "rain", "temperature": 73.62, "apparentTemperature": 73.62, "dewPoint": 49.56, "humidity": 0.43, "windSpeed": 0.72, "windBearing": 346, "cloudCover": 0, "pressure": 1013.54, "ozone": 359.32 }, { "time": 1465473600, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0037, "precipProbability": 0.13, "precipType": "rain", "temperature": 74.55, "apparentTemperature": 74.55, "dewPoint": 50.21, "humidity": 0.42, "windSpeed": 1.06, "windBearing": 6, "cloudCover": 0.02, "pressure": 1012.99, "ozone": 357.89 }, { "time": 1465477200, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0.0049, "precipProbability": 0.19, "precipType": "rain", "temperature": 73.71, "apparentTemperature": 73.71, "dewPoint": 50.77, "humidity": 0.45, "windSpeed": 1.09, "windBearing": 28, "cloudCover": 0.14, "pressure": 1012.49, "ozone": 357.05 }, { "time": 1465480800, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0064, "precipProbability": 0.28, "precipType": "rain", "temperature": 71.67, "apparentTemperature": 71.67, "dewPoint": 51.28, "humidity": 0.49, "windSpeed": 1.1, "windBearing": 58, "cloudCover": 0.29, "pressure": 1012.03, "ozone": 356.56 }, { "time": 1465484400, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0076, "precipProbability": 0.35, "precipType": "rain", "temperature": 68.47, "apparentTemperature": 68.47, "dewPoint": 51.06, "humidity": 0.54, "windSpeed": 1.33, "windBearing": 88, "cloudCover": 0.4, "pressure": 1011.74, "ozone": 355.99 }, { "time": 1465488000, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0081, "precipProbability": 0.38, "precipType": "rain", "temperature": 64.81, "apparentTemperature": 64.81, "dewPoint": 50.91, "humidity": 0.61, "windSpeed": 1.81, "windBearing": 107, "cloudCover": 0.4, "pressure": 1011.69, "ozone": 355.18 }, { "time": 1465491600, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0082, "precipProbability": 0.39, "precipType": "rain", "temperature": 60.96, "apparentTemperature": 60.96, "dewPoint": 50.53, "humidity": 0.69, "windSpeed": 2.36, "windBearing": 118, "cloudCover": 0.36, "pressure": 1011.79, "ozone": 354.27 }, { "time": 1465495200, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0077, "precipProbability": 0.36, "precipType": "rain", "temperature": 57.83, "apparentTemperature": 57.83, "dewPoint": 49.65, "humidity": 0.74, "windSpeed": 2.88, "windBearing": 127, "cloudCover": 0.3, "pressure": 1012.02, "ozone": 353.33 }, { "time": 1465498800, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0063, "precipProbability": 0.27, "precipType": "rain", "temperature": 55.62, "apparentTemperature": 55.62, "dewPoint": 48.17, "humidity": 0.76, "windSpeed": 3.45, "windBearing": 138, "cloudCover": 0.22, "pressure": 1012.46, "ozone": 352.26 }, { "time": 1465502400, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0044, "precipProbability": 0.17, "precipType": "rain", "temperature": 53.62, "apparentTemperature": 53.62, "dewPoint": 46.22, "humidity": 0.76, "windSpeed": 4.24, "windBearing": 149, "cloudCover": 0.13, "pressure": 1013.06, "ozone": 351.16 }, { "time": 1465506000, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0026, "precipProbability": 0.08, "precipType": "rain", "temperature": 51.54, "apparentTemperature": 51.54, "dewPoint": 44.4, "humidity": 0.76, "windSpeed": 4.55, "windBearing": 155, "cloudCover": 0.08, "pressure": 1013.48, "ozone": 350.29 }, { "time": 1465509600, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0.0014, "precipProbability": 0.03, "precipType": "rain", "temperature": 49.33, "apparentTemperature": 47.72, "dewPoint": 43.02, "humidity": 0.79, "windSpeed": 4.54, "windBearing": 158, "cloudCover": 0.09, "pressure": 1013.59, "ozone": 349.89 }, { "time": 1465513200, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 47.3, "apparentTemperature": 45.44, "dewPoint": 41.93, "humidity": 0.81, "windSpeed": 4.42, "windBearing": 160, "cloudCover": 0.15, "pressure": 1013.51, "ozone": 349.72 }, { "time": 1465516800, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 45.93, "apparentTemperature": 43.9, "dewPoint": 41.34, "humidity": 0.84, "windSpeed": 4.35, "windBearing": 163, "cloudCover": 0.19, "pressure": 1013.41, "ozone": 349.37 }, { "time": 1465520400, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 45.27, "apparentTemperature": 43.1, "dewPoint": 41.52, "humidity": 0.87, "windSpeed": 4.38, "windBearing": 166, "cloudCover": 0.21, "pressure": 1013.39, "ozone": 348.52 }, { "time": 1465524000, "summary": "Clear", "icon": "clear-night", "precipIntensity": 0, "precipProbability": 0, "temperature": 45.87, "apparentTemperature": 43.78, "dewPoint": 42.83, "humidity": 0.89, "windSpeed": 4.41, "windBearing": 170, "cloudCover": 0.22, "pressure": 1013.37, "ozone": 347.48 }, { "time": 1465527600, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 47.55, "apparentTemperature": 45.76, "dewPoint": 44.3, "humidity": 0.88, "windSpeed": 4.37, "windBearing": 174, "cloudCover": 0.22, "pressure": 1013.34, "ozone": 346.76 }, { "time": 1465531200, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 50.58, "apparentTemperature": 50.58, "dewPoint": 45.57, "humidity": 0.83, "windSpeed": 4.22, "windBearing": 179, "cloudCover": 0.21, "pressure": 1013.31, "ozone": 346.63 }, { "time": 1465534800, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 54.26, "apparentTemperature": 54.26, "dewPoint": 46.34, "humidity": 0.75, "windSpeed": 3.92, "windBearing": 185, "cloudCover": 0.19, "pressure": 1013.27, "ozone": 346.82 }, { "time": 1465538400, "summary": "Clear", "icon": "clear-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 57.64, "apparentTemperature": 57.64, "dewPoint": 46.74, "humidity": 0.67, "windSpeed": 3.6, "windBearing": 190, "cloudCover": 0.21, "pressure": 1013.15, "ozone": 346.98 }, { "time": 1465542000, "summary": "Partly Cloudy", "icon": "partly-cloudy-day", "precipIntensity": 0, "precipProbability": 0, "temperature": 61.37, "apparentTemperature": 61.37, "dewPoint": 47.71, "humidity": 0.61, "windSpeed": 3.25, "windBearing": 193, "cloudCover": 0.29, "pressure": 1012.94, "ozone": 346.93 }, { "time": 1465545600, "summary": "Partly Cloudy", "icon": "partly-cloudy-day", "precipIntensity": 0.0008, "precipProbability": 0.01, "precipType": "rain", "temperature": 64.99, "apparentTemperature": 64.99, "dewPoint": 48.5, "humidity": 0.55, "windSpeed": 2.9, "windBearing": 196, "cloudCover": 0.41, "pressure": 1012.66, "ozone": 346.84 }, { "time": 1465549200, "summary": "Partly Cloudy", "icon": "partly-cloudy-day", "precipIntensity": 0.0016, "precipProbability": 0.03, "precipType": "rain", "temperature": 68.47, "apparentTemperature": 68.47, "dewPoint": 49.7, "humidity": 0.51, "windSpeed": 2.58, "windBearing": 198, "cloudCover": 0.5, "pressure": 1012.32, "ozone": 346.91 }, { "time": 1465552800, "summary": "Partly Cloudy", "icon": "partly-cloudy-day", "precipIntensity": 0.0025, "precipProbability": 0.07, "precipType": "rain", "temperature": 71.48, "apparentTemperature": 71.48, "dewPoint": 51.58, "humidity": 0.5, "windSpeed": 2.29, "windBearing": 200, "cloudCover": 0.51, "pressure": 1011.85, "ozone": 347.22 }, { "time": 1465556400, "summary": "Partly Cloudy", "icon": "partly-cloudy-day", "precipIntensity": 0.0037, "precipProbability": 0.13, "precipType": "rain", "temperature": 73.86, "apparentTemperature": 73.86, "dewPoint": 53.9, "humidity": 0.5, "windSpeed": 2.02, "windBearing": 200, "cloudCover": 0.49, "pressure": 1011.31, "ozone": 347.67 }, { "time": 1465560000, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.006, "precipProbability": 0.26, "precipType": "rain", "temperature": 75.53, "apparentTemperature": 75.53, "dewPoint": 56.18, "humidity": 0.51, "windSpeed": 1.8, "windBearing": 201, "cloudCover": 0.51, "pressure": 1010.86, "ozone": 348.2 }, { "time": 1465563600, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0124, "precipProbability": 0.49, "precipType": "rain", "temperature": 75.03, "apparentTemperature": 75.03, "dewPoint": 56.87, "humidity": 0.53, "windSpeed": 1.1, "windBearing": 207, "cloudCover": 0.61, "pressure": 1010.54, "ozone": 348.84 }, { "time": 1465567200, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0209, "precipProbability": 0.55, "precipType": "rain", "temperature": 73.65, "apparentTemperature": 73.65, "dewPoint": 57.24, "humidity": 0.57, "windSpeed": 0.62, "windBearing": 219, "cloudCover": 0.75, "pressure": 1010.33, "ozone": 349.55 }, { "time": 1465570800, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0271, "precipProbability": 0.58, "precipType": "rain", "temperature": 70.87, "apparentTemperature": 70.87, "dewPoint": 56.8, "humidity": 0.61, "windSpeed": 0.4, "windBearing": 233, "cloudCover": 0.86, "pressure": 1010.29, "ozone": 350.14 }, { "time": 1465574400, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0287, "precipProbability": 0.59, "precipType": "rain", "temperature": 66.66, "apparentTemperature": 66.66, "dewPoint": 55.78, "humidity": 0.68, "windSpeed": 0.41, "windBearing": 224, "cloudCover": 0.89, "pressure": 1010.54, "ozone": 350.52 }, { "time": 1465578000, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0276, "precipProbability": 0.58, "precipType": "rain", "temperature": 59.88, "apparentTemperature": 59.88, "dewPoint": 52.3, "humidity": 0.76, "windSpeed": 0.61, "windBearing": 201, "cloudCover": 0.9, "pressure": 1011.01, "ozone": 350.78 }, { "time": 1465581600, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0241, "precipProbability": 0.57, "precipType": "rain", "temperature": 55.4, "apparentTemperature": 55.4, "dewPoint": 49.89, "humidity": 0.82, "windSpeed": 1.38, "windBearing": 195, "cloudCover": 0.9, "pressure": 1011.48, "ozone": 351.01 }, { "time": 1465585200, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0185, "precipProbability": 0.54, "precipType": "rain", "temperature": 53.53, "apparentTemperature": 53.53, "dewPoint": 48.64, "humidity": 0.83, "windSpeed": 2.08, "windBearing": 201, "cloudCover": 0.93, "pressure": 1011.92, "ozone": 351.21 }, { "time": 1465588800, "summary": "Light Rain", "icon": "rain", "precipIntensity": 0.0113, "precipProbability": 0.48, "precipType": "rain", "temperature": 52.93, "apparentTemperature": 52.93, "dewPoint": 47.97, "humidity": 0.83, "windSpeed": 2.79, "windBearing": 207, "cloudCover": 0.94, "pressure": 1012.36, "ozone": 351.39 }, { "time": 1465592400, "summary": "Drizzle", "icon": "rain", "precipIntensity": 0.0056, "precipProbability": 0.23, "precipType": "rain", "temperature": 52.19, "apparentTemperature": 52.19, "dewPoint": 47.32, "humidity": 0.83, "windSpeed": 3.4, "windBearing": 209, "cloudCover": 0.95, "pressure": 1012.69, "ozone": 351.65 }] }, "daily": { "summary": "Light rain today through Wednesday, with temperatures peaking at 83°F on Sunday.", "icon": "rain", "data": [{ "time": 1465419600, "summary": "Drizzle starting in the evening.", "icon": "rain", "sunriseTime": 1465440604, "sunsetTime": 1465495489, "moonPhase": 0.15, "precipIntensity": 0.0029, "precipIntensityMax": 0.0082, "precipIntensityMaxTime": 1465491600, "precipProbability": 0.39, "precipType": "rain", "temperatureMin": 46.32, "temperatureMinTime": 1465430400, "temperatureMax": 74.55, "temperatureMaxTime": 1465473600, "apparentTemperatureMin": 45.17, "apparentTemperatureMinTime": 1465430400, "apparentTemperatureMax": 74.55, "apparentTemperatureMaxTime": 1465473600, "dewPoint": 47.71, "humidity": 0.69, "windSpeed": 2.11, "windBearing": 149, "visibility": 6.21, "cloudCover": 0.13, "pressure": 1014.79, "ozone": 361.41 }, { "time": 1465506000, "summary": "Light rain starting in the afternoon.", "icon": "rain", "sunriseTime": 1465526993, "sunsetTime": 1465581923, "moonPhase": 0.19, "precipIntensity": 0.0079, "precipIntensityMax": 0.0287, "precipIntensityMaxTime": 1465574400, "precipProbability": 0.59, "precipType": "rain", "temperatureMin": 45.27, "temperatureMinTime": 1465520400, "temperatureMax": 75.53, "temperatureMaxTime": 1465560000, "apparentTemperatureMin": 43.1, "apparentTemperatureMinTime": 1465520400, "apparentTemperatureMax": 75.53, "apparentTemperatureMaxTime": 1465560000, "dewPoint": 48.79, "humidity": 0.7, "windSpeed": 2.66, "windBearing": 181, "cloudCover": 0.47, "pressure": 1012.26, "ozone": 348.74 }, { "time": 1465592400, "summary": "Partly cloudy starting in the evening.", "icon": "partly-cloudy-day", "sunriseTime": 1465613384, "sunsetTime": 1465668355, "moonPhase": 0.22, "precipIntensity": 0.0005, "precipIntensityMax": 0.0056, "precipIntensityMaxTime": 1465592400, "precipProbability": 0.23, "precipType": "rain", "temperatureMin": 46.16, "temperatureMinTime": 1465610400, "temperatureMax": 80.48, "temperatureMaxTime": 1465650000, "apparentTemperatureMin": 43.99, "apparentTemperatureMinTime": 1465610400, "apparentTemperatureMax": 80, "apparentTemperatureMaxTime": 1465650000, "dewPoint": 48.79, "humidity": 0.67, "windSpeed": 3.73, "windBearing": 251, "cloudCover": 0.32, "pressure": 1012.96, "ozone": 340.05 }, { "time": 1465678800, "summary": "Mostly cloudy throughout the day.", "icon": "partly-cloudy-day", "sunriseTime": 1465699777, "sunsetTime": 1465754785, "moonPhase": 0.25, "precipIntensity": 0.0004, "precipIntensityMax": 0.001, "precipIntensityMaxTime": 1465754400, "precipProbability": 0.01, "precipType": "rain", "temperatureMin": 48.48, "temperatureMinTime": 1465696800, "temperatureMax": 82.72, "temperatureMaxTime": 1465736400, "apparentTemperatureMin": 46.67, "apparentTemperatureMinTime": 1465696800, "apparentTemperatureMax": 81.45, "apparentTemperatureMaxTime": 1465736400, "dewPoint": 48.75, "humidity": 0.59, "windSpeed": 4.23, "windBearing": 234, "cloudCover": 0.38, "pressure": 1011.89, "ozone": 325.92 }, { "time": 1465765200, "summary": "Mostly cloudy throughout the day.", "icon": "partly-cloudy-day", "sunriseTime": 1465786172, "sunsetTime": 1465841213, "moonPhase": 0.28, "precipIntensity": 0.0021, "precipIntensityMax": 0.0038, "precipIntensityMaxTime": 1465848000, "precipProbability": 0.13, "precipType": "rain", "temperatureMin": 50.08, "temperatureMinTime": 1465783200, "temperatureMax": 76.67, "temperatureMaxTime": 1465819200, "apparentTemperatureMin": 50.08, "apparentTemperatureMinTime": 1465783200, "apparentTemperatureMax": 76.67, "apparentTemperatureMaxTime": 1465819200, "dewPoint": 49.15, "humidity": 0.63, "windSpeed": 5.32, "windBearing": 241, "cloudCover": 0.6, "pressure": 1005.31, "ozone": 336.68 }, { "time": 1465851600, "summary": "Light rain starting in the afternoon.", "icon": "rain", "sunriseTime": 1465872569, "sunsetTime": 1465927640, "moonPhase": 0.31, "precipIntensity": 0.0116, "precipIntensityMax": 0.0349, "precipIntensityMaxTime": 1465916400, "precipProbability": 0.61, "precipType": "rain", "temperatureMin": 44.09, "temperatureMinTime": 1465869600, "temperatureMax": 68.71, "temperatureMaxTime": 1465902000, "apparentTemperatureMin": 44.09, "apparentTemperatureMinTime": 1465869600, "apparentTemperatureMax": 68.71, "apparentTemperatureMaxTime": 1465902000, "dewPoint": 49.34, "humidity": 0.79, "windSpeed": 1.35, "windBearing": 336, "cloudCover": 0.64, "pressure": 1003.41, "ozone": 345.96 }, { "time": 1465938000, "summary": "Partly cloudy in the morning.", "icon": "partly-cloudy-night", "sunriseTime": 1465958969, "sunsetTime": 1466014064, "moonPhase": 0.34, "precipIntensity": 0.0028, "precipIntensityMax": 0.0086, "precipIntensityMaxTime": 1465938000, "precipProbability": 0.42, "precipType": "rain", "temperatureMin": 44.07, "temperatureMinTime": 1465956000, "temperatureMax": 73.62, "temperatureMaxTime": 1465999200, "apparentTemperatureMin": 42.34, "apparentTemperatureMinTime": 1465956000, "apparentTemperatureMax": 73.62, "apparentTemperatureMaxTime": 1465999200, "dewPoint": 46.02, "humidity": 0.71, "windSpeed": 3.38, "windBearing": 299, "cloudCover": 0.14, "pressure": 1006.24, "ozone": 339.11 }, { "time": 1466024400, "summary": "Clear throughout the day.", "icon": "clear-day", "sunriseTime": 1466045370, "sunsetTime": 1466100487, "moonPhase": 0.37, "precipIntensity": 0.0014, "precipIntensityMax": 0.0046, "precipIntensityMaxTime": 1466100000, "precipProbability": 0.18, "precipType": "rain", "temperatureMin": 43.38, "temperatureMinTime": 1466042400, "temperatureMax": 80.09, "temperatureMaxTime": 1466078400, "apparentTemperatureMin": 43.38, "apparentTemperatureMinTime": 1466042400, "apparentTemperatureMax": 79.51, "apparentTemperatureMaxTime": 1466078400, "dewPoint": 48.3, "humidity": 0.63, "windSpeed": 2.07, "windBearing": 264, "cloudCover": 0, "pressure": 1011.44, "ozone": 307.08 }] }, "flags": { "sources": ["gfs", "cmc", "fnmoc", "metno_ce", "isd", "madis"], "metno-license": "Based on data from the Norwegian Meteorological Institute. (http://api.met.no/)", "isd-stations": ["156000-99999", "156050-99999", "156091-99999", "156130-99999", "156140-99999"], "madis-stations": ["LBSF"], "units": "us" } }