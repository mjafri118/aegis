import React from "react";
import { TouchableOpacity, Image, StyleSheet, Text, View, TextInput, ActivityIndicator, Keyboard } from "react-native";
import { MapView, Constants, Location, Permissions } from "expo";
import Polyline from '@mapbox/polyline';
import { SearchBar } from 'react-native-elements'
export default class App extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            isLoading : true,
            markers : [],
            deviceLat: 42.3501658,
            deviceLong: -71.1032777,
            coords: [],
            showRoute: 'false',
            cordLatitude:0,
            cordLongitude:0,
            destinationName: 'Destination',
            concat: null,
            error: null,
            key: "AIzaSyCzqHOSvVeDdLH5UfKVYtvy8XGP7n2k6fo",
            search: "",
            bottomLeft: null,
            topRight: null,
            mapLat: 42.3501658,
            mapLong: -71.1032777,
            deltaLat: 0.0922,
            deltaLong: 0.0421,
        };

        this.mergeLot = this.mergeLot.bind(this);
        this.mapMoved = this.mapMoved.bind(this);
    }

    async getDirections(startLoc, destinationLoc) {

        try {
               let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?key=${this.state.key}&origin=${ startLoc }&destination=${ destinationLoc }`)
               let respJson = await resp.json();
               let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
               let coords = points.map((point, index) => {
                   return  {
                       latitude : point[0],
                       longitude : point[1]
                   }
               })
               this.setState({coords: coords})
               this.setState({showRoute: "true"})
               return coords
           } catch(error) {
             console.log('masuk fungsi: ' + error)
               this.setState({showRoute: "error"})
               return error
           }
       }

    mergeLot(){
        if (this.state.deviceLat != null && this.state.deviceLong!=null)
        {
            let concatLot = this.state.deviceLat +","+this.state.deviceLong
            this.setState({
                concat: concatLot
            }, () => {
                let to = this.state.cordLatitude + "," + this.state.cordLongitude;
                this.getDirections(concatLot, to);
            });
        }
    }

    async mapMoved(){
        let bottomLeftLat = this.state.mapLat - this.state.deltaLat;
        let bottomLeftLong = this.state.mapLong - this.state.deltaLong;
        let topRightLat = this.state.mapLat + this.state.deltaLat;
        let topRightLong = this.state.mapLong + this.state.deltaLong;
        this.setState({
            bottomLeft: bottomLeftLat + "," + bottomLeftLong,
            topRight: topRightLat + "," + topRightLong
        })
    }

    _getLocationAsync = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
        this.setState({
        locationResult: 'Permission to access location was denied',
        });
        }

        let location = await Location.getCurrentPositionAsync({});
        this.setState({
                deviceLong: JSON.stringify(location.coords.longitude),
                deviceLat: JSON.stringify(location.coords.latitude)
            });
    };

    _onPressButton = async () => {
        Keyboard.dismiss();
        this.fetchMarkerData();
        try {
               let resp = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${this.state.search}&inputtype=textquery&fields=geometry,name&locationbias=circle:2000@${this.state.deviceLat},${this.state.deviceLong}&key=${this.state.key}`)

               let respJson = await resp.json();
               let lat = respJson.candidates[0].geometry.location.lat;
               let lng = respJson.candidates[0].geometry.location.lng;
               let name = respJson.candidates[0].name;
               this.setState({cordLatitude: lat});
               this.setState({cordLongitude: lng});
               this.setState({destinationName: name});
               this.mergeLot();
               return
           } catch(error) {
             console.log('masuk fungsi: ' + error)
               this.setState({showRoute: "error"})
               return error
           }
    }

    fetchMarkerData() {
        // Sample URL: https://us-central1-aegishackwash.cloudfunctions.net/giveCrimeInView?bottomLeft=42,-71&topRight=43,-70
        fetch(`https://us-central1-aegishackwash.cloudfunctions.net/giveCrimeInView?bottomLeft=${this.state.bottomLeft}&topRight=${this.state.topRight}`)
          .then((response) => response.json())
          .then((responseJson) => {
            this.setState({
              isLoading: false,
              markers: responseJson.slice(0,100),
            });
          })
          .catch((error) => {
            console.log(error);
          });
    }
    render() {
        return (
            <View style={styles.container}>
                <View style={styles.searchBar}>
                    <SearchBar
                        ref={search => this.search = search}
                        containerStyle = { styles.searchTextInput}
                        inputContainerStyle = {{backgroundColor: "black"}}
                        round
                        lightTheme
                        searchIcon={{ size: 24 }}
                        onChangeText={(search) => this.setState({search: search})}
                        onClear={(search) => this.setState(search)}
                        placeholder='Enter your destination here' />

                        <TouchableOpacity onPress={this._onPressButton}>
                            <Image
                                style={styles.submitButton}
                                source={require('./assets/searchbutton.png')}/>
                        </TouchableOpacity>
                </View>

                <MapView
                    provider='google'  // remove for 100x better UX. LOL.
                    showUserLocation = {true}
                    style={styles.map}
                    region={{
                      latitude: this.state.mapLat ? this.state.mapLat : this.state.deviceLat,
                      longitude: this.state.mapLong ? this.state.mapLong : this.state.deviceLong,
                      latitudeDelta: this.state.deltaLat ? this.state.deltaLat : 0.0922,
                      longitudeDelta: this.state.deltaLong ? this.state.deltaLong : 0.0421,

                    }}
                    onRegionChangeComplete = {(region) => {this.setState({
                        mapLat:parseFloat(region.latitude),
                        mapLong:parseFloat(region.longitude),
                        deltaLat:parseFloat(region.latitudeDelta),
                        deltaLong:parseFloat(region.longitudeDelta)
                    });
                        this.mapMoved();}
                    }
                >
                    <MapView.Marker
                        coordinate={{
                            latitude: this.state.deviceLat,
                            longitude: this.state.deviceLong}}
                        image={require('./assets/my-location-icon.png')}
                    />

                    <MapView.Marker
                        coordinate={{
                            latitude: parseFloat(this.state.cordLatitude),
                            longitude: parseFloat(this.state.cordLongitude)}}
                        title={this.state.destinationName}
                    />

                    {!!this.state.deviceLat && !!this.state.deviceLong && this.state.showRoute == 'true' && <MapView.Polyline
                        coordinates={this.state.coords}
                        strokeWidth={2}
                        strokeColor="red"/>
                    }

                    {!!this.state.deviceLat && !!this.state.deviceLong && this.state.showRoute == 'error' && <MapView.Polyline
                      coordinates={[
                          {latitude: this.state.deviceLat, longitude: this.state.deviceLong},
                          {latitude: parseFloat(this.state.cordLatitude), longitude: parseFloat(this.state.cordLongitude)},
                      ]}
                      strokeWidth={2}
                      strokeColor="orange"/>
                     }

                    {this.state.isLoading ? null : this.state.markers.map((marker, index) => {
                        const coords = {
                            latitude: parseFloat(marker.Lat),
                            longitude: parseFloat(marker.Long),
                        };
                        return (
                            <MapView.Marker
                                key={index}
                                coordinate={coords}
                                title={marker.OFFENSE_CODE_GROUP}
                                description={marker.INCIDENT_NUMBER}
                                image={require('./assets/reddot.png')}
                             />
                        );
                        }
                    )}
                </MapView>
                </View>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',

    },
    map: {
        flex: 1,
        height: null
    },

    searchBar: {
        top: 20,
        backgroundColor: '#e2e7ed',
        paddingBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',

    },

    searchTextInput: {
        alignItems: 'stretch',
        flexGrow: 1
    }

});
