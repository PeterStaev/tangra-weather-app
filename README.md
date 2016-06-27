# Tangra's Summer Loving Weather App

The application uses Telerik NativeScript UI Pro. In order to compile you must download your trial copy from [here](http://www.telerik.com/nativescript-ui). 
After that you must replace the path to the `.gz` file in the `package.json` and point it to where you have installed Telerik's Nativescript UI Pro. Finally run the app using `tns run ios` 

Note currently there is bug in iOS that clicking on a chart does not send the `pointIndex` property to the underlying event handler ([#4](https://github.com/telerik/nativescript-…) ). 
In order to fix it after `npm install` you must change line 57 in `node_modules/nativescript-telerik-ui-pro/chart/chart.ios.js` from `pointIndex: index.intValue` to `pointIndex: index`. 

Also keep in mind for Android there are currently many issues and limitations of the chart controls, so full functionality of the app is available only on iOS.

You can view the app in action [here](http://www.screencast.com/t/uXInbEdak1kG).  
