import React from 'react'
import { connect } from 'react-redux'
import L from 'leaflet'
import PropTypes from 'prop-types'

import HereTileLayers from './hereTileLayers'

//import chroma.js
import chroma from 'chroma-js'
// defining the container styles the map sits in
const style = {
    width: '100%',
    height: '100vh'
  }

  // use these or add your own HERE Maps credentials
const hereAppCode = '0XXQyxbiCjVU7jN2URXuhg'
const hereAppId = 'yATlKFDZwdLtjHzyTeCK'

// using the reduced.day map styles, have a look at the imported hereTileLayers for more
const hereReducedDay = HereTileLayers.here({
    appId: hereAppId,
    appCode: hereAppCode,
    scheme: 'reduced.day'
  })


  // for this app we create two leaflet layer groups to control, one for the isochrone centers and one for the isochrone contours
const markersLayer = L.featureGroup()
const isochronesLayer = L.featureGroup()

// we define our bounds of the map
const southWest = L.latLng(-90, -180),
  northEast = L.latLng(90, 180),
  bounds = L.latLngBounds(southWest, northEast)

  // a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
    center: [25.95681, -35.729687],
    zoomControl: false,
    maxBounds: bounds,
    zoom: 2,
    layers: [markersLayer, isochronesLayer, hereReducedDay]
  }
  // this you have seen before, we define a react component
class Map extends React.Component {
    static propTypes = {
      isochronesControls: PropTypes.object.isRequired,
      mapEvents: PropTypes.object,
      dispatch: PropTypes.func.isRequired
    }
//isochrones layer with chroma.js
addIsochrones() {

    isochronesLayer.clearLayers();

    const isochrones = this.props.isochronesControls.isochrones.results;

    // if we have polygons in our response
    if (isochrones.length > 0) {
      let cnt = 0;

      // let's define a beautiful color range
      const scaleHsl = chroma
        .scale(["#f44242", "#f4be41", "#41f497"])
        .mode("hsl")
        .colors(isochrones.length);

      // looping through all polygons and adding them to the map
      for (const isochrone of isochrones) {
        for (const isochroneComponent of isochrone.component) {
          L.polygon(
            isochroneComponent.shape.map(function(coordString) {
              return coordString.split(",");
            }),
            {
              fillColor: scaleHsl[cnt],
              weight: 2,
              opacity: 1,
              color: "white",
              pane: "isochronesPane"
            }
          ).addTo(isochronesLayer);
        }
        cnt += 1;
      }

      this.map.fitBounds(isochronesLayer.getBounds())
    }
  }

    //new second additional function to add markers
    addIsochronesCenter() {

        // clear the markers layer beforehand
        markersLayer.clearLayers();
    
        const isochronesCenter = this.props.isochronesControls.settings
          .isochronesCenter;
    
        // does this object contain a latitude and longitude?
        if (isochronesCenter.lat && isochronesCenter.lng) {
          // we are creating a leaflet circle marker with a minimal tooltip
          L.circleMarker(isochronesCenter)
            .addTo(markersLayer)
            .bindTooltip(
              "latitude: " +
                isochronesCenter.lat +
                ", " +
                "longitude: " +
                isochronesCenter.lng,
              {
                permanent: false
              }
            )
            .openTooltip();
    
          // set the map view
          this.map.setView(isochronesCenter, 7);
        }
      }
    
  
    //new component for feature
    componentDidUpdate() {
        this.addIsochronesCenter();
        this.addIsochrones();
      }
    // and once the component has mounted we add everything to it
    componentDidMount() {
  
      // our map!
      this.map = L.map('map', mapParams)
  
      // we create a leaflet pane which will hold all isochrone polygons with a given opacity
      var isochronesPane = this.map.createPane('isochronesPane')
      isochronesPane.style.opacity = 0.9
  
      // our basemap and add it to the map
      const baseMaps = {
        'HERE reduced.day': hereReducedDay
      }
      L.control.layers(baseMaps).addTo(this.map)
  
      // we do want a zoom control
      L.control
        .zoom({
          position: 'topright'
        })
        .addTo(this.map)
  
      // and for the sake of advertising your map, you may add a logo to the map
      const brand = L.control({
        position: 'bottomright'
      })
      brand.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'brand')
        div.innerHTML =
          '<a href="https://gis-ops.com" target="_blank"><img src="data:image/png;base64,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" width="150px"></img></a>'
        return div
      }
      this.map.addControl(brand)
    }
  
    // don't forget to render it :-)
    render() {
      return <div id="map" style={style} />
    }
  }
  
  // and we already map the redux store to properties which we will start soon
  const mapStateToProps = (state) => {
    const isochronesControls = state.isochronesControls
    return {
      isochronesControls
    }
  }
  
  export default connect(mapStateToProps)(Map)