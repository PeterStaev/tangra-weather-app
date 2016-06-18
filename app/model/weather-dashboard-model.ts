import * as observable from "data/observable";
import * as http from "http";
import * as moment from "moment";
import settings = require("../shared/settings"); 

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
        icon1: { text: "\uf106", color: "#CCCCCC" },
        icon2: { text: "", color: "" },
        fontSize: 80
    },
    "partly-cloudy-day": {
        icon1: { text: "\uf106", color: "#CCCCCC" },
        icon2: { text: "\uf101", color: "#FFA500" },
        fontSize: 90
    },
    "partly-cloudy-night": {
        icon1: { text: "\uf106", color: "#CCCCCC" },
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

const W_API_KEY = "dde6b973b44c31b53664a87d4ed8e737";
const G_API_KEY = "AIzaSyDfd4V7aJ9IJdtMPkj6fbxWbZ87toXldL8";

export class WeatherDashboardModel extends observable.Observable {
    private _rawWeatherData: any;
    private _rawAddressData: any;
    
    constructor() {
        super();
        this.set("currentTemperature", "-");
        this.set("unitSystem", settings.unitSystem);
        this.set("selectedChartIndex", 0);
        this.set("isLoadingIn", false);
    }

    public loadRawData(lat: number, lon: number): Promise<any> {
        this.set("isLoadingIn", true);
        return new Promise((resolve, reject) => {
            let serviceCalls = [];
            serviceCalls.push(http.getJSON(`https://api.forecast.io/forecast/${W_API_KEY}/${lat},${lon}?units=${this.get("unitSystem")}&extend=hourly`));
            serviceCalls.push(http.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?key=${G_API_KEY}&latlng=${lat},${lon}&result_type=locality&language=en`));
            
           Promise.all(serviceCalls)
                .then((result) => {
                    this._rawWeatherData = result[0];
                    this._rawAddressData = result[1];
                    this.set("isLoadingIn", false);
                    resolve();
                })
                .catch((e) => console.log(`ERROR: ${e}`));
        });
    }

    public switchUnitSystem() {
        this.set("unitSystem", this.get("unitSystem") === "us" ? "si" : "us");
        settings.unitSystem = this.get("unitSystem");
    }
    
    public loadWeatherData() {
        let data = this._rawWeatherData;
        let unitSystem = this.get("unitSystem");
        let currentConditionIcon: ICurrentConditionIcon = currentConditionIcons[data.currently.icon];
        let unitSymbol: IUnitSymbol = units[unitSystem];
        let currentDailyData = data.daily.data[0];
        let reverseGeocodeResult = this._rawAddressData.results[0];
        let cityComponent = reverseGeocodeResult.address_components.filter((item) => item.types.indexOf("locality") !== -1);

        this.set("city", (cityComponent.length > 0 ? cityComponent[0].long_name : reverseGeocodeResult.formatted_address));        
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
        this.set("currentHumidity", `${Math.round(data.currently.humidity * 100)} %`);
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
                precipIntensity: item.precipIntensity * (unitSystem === "us" ? 25.4 : 1) // in/hr is a very small number so we convert to mm/h
            };
        }));
    }

    public filterHourlyData(dayIndex: number) {
        let secsPerDay = 24 * 60 * 60;
        let rawHourlyData = this._rawWeatherData.hourly.data;
        let selectedDay = this.get("daily")[dayIndex].day as Date;
        let hourlyData: Array<IHourlyData>;
        let fromTime: number;
        let toTime: number;
        
        if (dayIndex === 0) {
            // For the first day we should set the from to the first available hourly data, so we can still get 24 hourly points
            fromTime = rawHourlyData[0].time;
        }
        else {
            fromTime = selectedDay.getTime() / 1000; // Convert to Unix time
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
                        precipIntensity: item.precipIntensity * (this.get("unitSystem") === "us" ? 25.4 : 1) // in/hr is a very small number so we convert to mm/h
                    };
                });
        this.set("hourly", hourlyData);
        this.set("currentDay", selectedDay);
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