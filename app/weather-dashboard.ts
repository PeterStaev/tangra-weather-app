import { EventData } from "data/observable";
import { Page, NavigatedData } from "ui/page";
import { ChartEventData, RadCartesianChart } from "nativescript-telerik-ui-pro/chart";
import * as frame from "ui/frame";
import * as statusBar from "nativescript-status-bar";
import { GestureStateTypes, PinchGestureEventData } from "ui/gestures";
import { SelectedIndexChangedEventData } from "ui/segmented-bar";
import { GridLayout } from "ui/layouts/grid-layout";
import { Animation, AnimationDefinition } from "ui/animation";
import { View } from "ui/core/view";
import * as geolocation from "nativescript-geolocation";
import { WeatherDashboardModel } from "./weather-dashboard-model";

let model: WeatherDashboardModel;

let hourlyContainer: GridLayout;
let dailyContainer: GridLayout;
let hourlyTemperatureChart: RadCartesianChart;
let hourlyPrecipiationChart: RadCartesianChart;
let hourlyHumidityChart: RadCartesianChart;

let zoomInHourlyAnimationDefinitions: Array<AnimationDefinition>;
let zoomInDailyAnimationDefinitions: Array<AnimationDefinition>;
let switchUnitSystemFadeInAnimationDefinitions: Array<AnimationDefinition>;
let switchUnitSystemFadeOutAnimationDefinitions: Array<AnimationDefinition>;

export function pageLoaded() {
    setTimeout(() => statusBar.hide(), 250);
}

export function navigatingTo(args: NavigatedData) {
   
    model = args.context;
    
    var page = <Page>args.object;
    page.bindingContext = model;
    model.loadWeatherData();

    hourlyContainer = page.getViewById<GridLayout>("hourly-forecast-container");
    dailyContainer = page.getViewById<GridLayout>("daily-forecast-container");

    hourlyTemperatureChart = page.getViewById<RadCartesianChart>("hourly-temperature-chart");
    hourlyPrecipiationChart = page.getViewById<RadCartesianChart>("hourly-precipiation-chart");
    hourlyHumidityChart = page.getViewById<RadCartesianChart>("hourly-humidity-chart");

    zoomInDailyAnimationDefinitions = [
        {
            target: hourlyContainer,
            opacity: 0,
            scale: { x: 0, y: 0 },
            duration: 1000
        },
        {
            target: dailyContainer,
            opacity: 1,
            scale: { x: 1, y: 1 },
            duration: 1000
        }
    ];
    zoomInHourlyAnimationDefinitions = [
        {
            target: dailyContainer,
            opacity: 0,
            scale: { x: 0, y: 0 },
            duration: 1000
        },
        {
            target: hourlyContainer,
            opacity: 1,
            scale: { x: 1, y: 1 },
            duration: 1000
        }
    ]; 
    
    switchUnitSystemFadeOutAnimationDefinitions = [
        {
            target: page.getViewById<View>("current-condition-container"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("current-humidity"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("current-pressure"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("current-wind-speed"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("sunrise-time"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("sunset-time"),
            opacity: 0,
            duration: 500
        },
        {
            target: page.getViewById<View>("moon-phase-text"),
            opacity: 0,
            duration: 500
        }
    ];
    
    switchUnitSystemFadeInAnimationDefinitions = switchUnitSystemFadeOutAnimationDefinitions.map((item) => {
        return {
            target: item.target,
            opacity: 1,
            duration: item.duration
        }
    });
}

export function refreshData() {
    let fadeOutAnimation = new Animation(switchUnitSystemFadeOutAnimationDefinitions);
    let fadeInAnimation = new Animation(switchUnitSystemFadeInAnimationDefinitions);
    
    model.set("isLoadingIn", true);
    geolocation.getCurrentLocation({ maximumAge: 10 * 60 * 1000 }).then((value) => {
        Promise.all([fadeOutAnimation.play(), model.loadRawData(value.latitude, value.longitude)])
            .then(() => {
                fadeInAnimation.play();
                model.loadWeatherData();
            });
    });    
}

export function switchUnitSystem() {
    model.switchUnitSystem();
    refreshData()
}

export function onPointSelected(args: ChartEventData) {
    model.filterHourlyData(args.pointIndex);
    
    // HACK: set zoom once data is loaded, otherwise the chart crashes the app!
    hourlyTemperatureChart.horizontalZoom = 2
    hourlyPrecipiationChart.horizontalZoom = 2
    hourlyHumidityChart.horizontalZoom = 2

    let animation = new Animation(zoomInHourlyAnimationDefinitions);
    animation.play();
}

export function switchToDailyChart() {
    let animation = new Animation(zoomInDailyAnimationDefinitions);
    animation.play();
}

export function hourlyContainerZoomed(args: PinchGestureEventData) {
    let scale = Math.min(1, args.scale);

    dailyContainer.scaleX = 1 - scale;
    dailyContainer.scaleY = 1 - scale;
    dailyContainer.opacity = 1 - scale;

    hourlyContainer.scaleX = scale;
    hourlyContainer.scaleY = scale;
    hourlyContainer.opacity = scale;
    
    if (args.state === GestureStateTypes.ended) {
        let animation: Animation;
        if (scale > 0.5) {
            animation = new Animation(zoomInHourlyAnimationDefinitions);
            animation.play().then(() => {
               hourlyContainer.scaleX = undefined;
               hourlyContainer.scaleY = undefined;
               hourlyContainer.opacity = undefined; 
            });
        }
        else {
            animation = new Animation(zoomInDailyAnimationDefinitions);
            animation.play().then(() => {
                hourlyContainer.scaleX = 0;
                hourlyContainer.scaleY = 0;
                hourlyContainer.opacity = 0
            });
        }
    }
}
