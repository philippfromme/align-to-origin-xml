import BpmnModdle from "bpmn-moddle";

const moddle = new BpmnModdle();

export default function alignToOrigin(xml, gridSpacing) {
  return moddle.fromXML(xml).then(({ rootElement }) => {
    const diagrams = rootElement.get("bpmn:diagrams");

    diagrams.forEach((diagram) => {
      const plane = diagram.get("bpmndi:plane"),
        planeElements = plane.get("di:planeElement");

      if (!planeElements.length) {
        return;
      }

      const adjustment = getAdjustment(planeElements);

      if (adjustment.x === 0 && adjustment.y === 0) {
        return;
      }

      if (gridSpacing) {
        adjustment.x = quantize(adjustment.x, gridSpacing);
        adjustment.y = quantize(adjustment.y, gridSpacing);
      }

      console.log('bounds before', getPlaneElementsBounds(planeElements));

      console.log('adjustment', adjustment);

      adjust(planeElements, adjustment);

      console.log('bounds after', getPlaneElementsBounds(planeElements));
    });

    return moddle.toXML(rootElement, { format: true });
  });
}

function getAdjustment(planeElements) {
  const bounds = getPlaneElementsBounds(planeElements);

  return {
    x: -bounds.left,
    y: -bounds.top
  };
}

function getPlaneElementsBounds(planeElements) {
  return planeElements.reduce((bounds, planeElement) => {
    if (bounds === null) {
      return getBounds(planeElement);
    }

    return {
      top: Math.min(bounds.top, getBounds(planeElement).top),
      left: Math.min(bounds.left, getBounds(planeElement).left)
    };
  }, null);
}

function getBounds(planeElement) {
  if (planeElement.$type === "bpmndi:BPMNShape") {
    return getShapeBounds(planeElement);
  } else if (planeElement.$type === "bpmndi:BPMNEdge") {
    return getEdgeBounds(planeElement);
  }
}

function getShapeBounds(shape) {
  const bounds = shape.get("di:bounds");

  const x = bounds.get("dc:x"),
    y = bounds.get("dc:y");

  const label = shape.get("bpmndi:label");

  if (label) {
    const labelBounds = getShapeBounds(label);

    return {
      top: Math.min(y, labelBounds.top),
      left: Math.min(x, labelBounds.left)
    };
  }

  return {
    top: y,
    left: x
  };
}

function getEdgeBounds(edge) {
  const edgeBounds = edge.get("di:waypoint").reduce((bounds, waypoint) => {
    if (bounds === null) {
      return getWaypointBounds(waypoint);
    }

    const x = waypoint.get("dc:x"),
      y = waypoint.get("dc:y");

    return {
      top: Math.min(bounds.top, y),
      left: Math.min(bounds.left, x)
    };
  }, null);

  const label = edge.get("bpmndi:label");

  if (label) {
    const labelBounds = getShapeBounds(label);

    return {
      top: Math.min(edgeBounds.top, labelBounds.top),
      left: Math.min(edgeBounds.left, labelBounds.left)
    };
  }

  return edgeBounds;
}

function getWaypointBounds(waypoint) {
  const x = waypoint.get("dc:x"),
    y = waypoint.get("dc:y");

  return {
    top: y,
    left: x
  };
}

function adjust(planeElements, adjustment) {
  planeElements.forEach((planeElement) => {
    if (planeElement.$type === "bpmndi:BPMNShape") {
      return adjustShape(planeElement, adjustment);
    } else if (planeElement.$type === "bpmndi:BPMNEdge") {
      return adjustEdge(planeElement, adjustment);
    }
  });
}

function adjustShape(shape, adjustment) {
  const bounds = shape.get("di:bounds");

  bounds.set("dc:x", bounds.get("dc:x") + adjustment.x);
  bounds.set("dc:y", bounds.get("dc:y") + adjustment.y);

  const label = shape.get("bpmndi:label");

  if (label) {
    const bounds = label.get("di:bounds");

    bounds.set("dc:x", bounds.get("dc:x") + adjustment.x);
    bounds.set("dc:y", bounds.get("dc:y") + adjustment.y);
  }
}

function adjustEdge(edge, adjustment) {
  edge.get("di:waypoint").forEach((waypoint) => {
    waypoint.set("dc:x", waypoint.get("dc:x") + adjustment.x);
    waypoint.set("dc:y", waypoint.get("dc:y") + adjustment.y);
  });

  const label = edge.get("bpmndi:label");

  if (label) {
    const bounds = label.get("di:bounds");

    bounds.set("dc:x", bounds.get("dc:x") + adjustment.x);
    bounds.set("dc:y", bounds.get("dc:y") + adjustment.y);
  }
}

// helpers /////////////////////////

function quantize(value, quantum, fn) {
  if (!fn) {
    fn = 'round';
  }

  return Math[ fn ](value / quantum) * quantum;
}