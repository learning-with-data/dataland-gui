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

function generate_scale(data, column, scaleType, range) {
  const domain = data
    .map((row) => row[column])
    .filter((item) => !Number.isNaN(item));
  const scaleFn = vega.scale(scaleType);

  if (scaleType === "sequential") {
    const scale = scaleFn()
      .domain([Math.min(...domain), Math.max(...domain)])
      .interpolator(range);
    return scale;
  } else {
    const scale = scaleFn()
      .domain([Math.min(...domain), Math.max(...domain)])
      .range(range);
    return scale;
  }
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
    const colorField = layer.encoding.color.field;

    // TODO: scale types
    let sizeScale;
    if (sizeField !== undefined) {
      sizeScale = generate_scale(data, sizeField, "sqrt", [5, 25]);
    }

    let colorScale;
    if (colorField !== undefined) {
      colorScale = generate_scale(
        data,
        colorField,
        "sequential",
        vega.scheme("blues")
      );
    }

    return data.map((row, index) => {
      // FIXME: We are going to end up with a lot of markers off the
      // west coast of Africa due to this.
      // Skip markers if data is missing.
      const position = [row[latField] ?? 0, row[longField] ?? 0];

      let size = 5;
      if (row[sizeField] !== undefined) {
        size = sizeScale(row[sizeField]);
      }

      let color = layer.encoding.color;
      if (row[colorField] !== undefined) {
        color = colorScale(row[colorField]);
      }

      const marker = (
        <CircleMarker
          key={layer.name + index}
          center={position}
          pathOptions={{
            color: color,
            fillColor: color,
            opacity: 0.7,
            fillOpacity: 0.7
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
