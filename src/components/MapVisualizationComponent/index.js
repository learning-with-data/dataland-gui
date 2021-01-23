import React from "react";

import PropTypes from "prop-types";

import { getBounds } from "geolib";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import * as vega from "vega";

import "leaflet/dist/leaflet.css";

// https://stackoverflow.com/a/51222271
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

function generate_scale(data, column) {
  const domain = data.map((row) => row[column]);

  const sqrt = vega.scale("sqrt"); // TODO
  const scale = sqrt()
    .domain([Math.min(...domain), Math.max(...domain)])
    .range([5, 25]);
  return scale;
}

function MapPlot(props) {
  const map = useMap();

  let objects = props.spec.layer.map((layer) => {
    const data = layer.data.values;
    const latField =
      layer.encoding.latitude !== undefined
        ? layer.encoding.latitude.field
        : undefined;
    const longField =
      layer.encoding.longitude !== undefined
        ? layer.encoding.longitude.field
        : undefined;
    const sizeField =
      layer.encoding.size !== undefined ? layer.encoding.size.field : undefined;

    let scale;
    if (sizeField !== undefined) {
      scale = generate_scale(data, sizeField);
    }

    return data.map((row, index) => {
      const position = [row[latField] ?? 0, row[longField] ?? 0];
      let size = 5;
      if (row[sizeField] !== undefined) {
        size = scale(row[sizeField]);
      }

      const marker = (
        <CircleMarker
          key={index}
          center={position}
          pathOptions={{
            color: layer.encoding.color,
            fillColor: layer.encoding.color,
          }}
          radius={size}
        />
      );

      return [
        marker,
        { latitude: row[latField] ?? 0, longitude: row[longField] ?? 0 },
      ];
    });
  });

  objects = objects.flat();

  let bounds = {};
  if (objects.length > 0) {
    bounds = getBounds(objects.map((item) => item[1]));
    map.fitBounds([
      [bounds.maxLat, bounds.maxLng],
      [bounds.minLat, bounds.minLng],
    ]);
  }

  objects = objects.map((item) => item[0]);
  return objects;
}

const MapVisualizationComponent = React.memo((props) => {
  return (
    <MapContainer center={[0, 0]} zoom={1} scrollWheelZoom={true} {...props}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
      />
      <MapPlot spec={props.spec} />
    </MapContainer>
  );
});

MapVisualizationComponent.propTypes = {
  spec: PropTypes.object,
};

MapVisualizationComponent.displayName = "MapVisualizationComponent";

export default MapVisualizationComponent;
