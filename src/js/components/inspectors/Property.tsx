const imutils = require('../../util/immutable-utils');
const getIn = imutils.getIn;
const getInVis = imutils.getInVis;

import * as React from 'react';
import {connect} from 'react-redux';
import { Dispatch } from 'redux';
import {resetMarkVisual} from '../../actions/markActions';
import {PrimType} from '../../constants/primTypes';
import {State} from '../../store';
import {AutoComplete} from './AutoComplete';
import {FormInputProperty} from './FormInputProperty';

// hunch: probably actually needs to be a bunch of different types anded to a base type
// instead of one type with everything optional
// but it would take a long time to figure out what the mutually exclusive fields are
interface OwnProps {
  primId?: number;
  primType?: PrimType;
  name?: string;
  label?: string;
  dsId?: number;
  autoType?: string;
  onChange?: (value) => void;
  type?: string;
  firstChild?: boolean;
  canDrop?: boolean;
  opts?: string[];
  value?: any;
}

interface StateProps {
  group?:  any;
  signal?: any;
  value?: string|number|boolean|any; // TODO: remove 'any', add Immutable.Map type
  field?:  any;
  scale?:  any;
  srcField?:  any;
  scaleName?: any;
}

interface DispatchProps {
  unbind?: () => void;
}

function mapStateToProps(reduxState: State, ownProps: OwnProps): StateProps {
  if (!ownProps.primId) {
    return {};
  }

  const state = getInVis(reduxState, ownProps.primType + '.' + ownProps.primId);
  let path;
  let dsId;

  if (ownProps.name) {
    if (ownProps.primType === PrimType.MARKS) {
      path = 'encode.update.' + ownProps.name;
      dsId = getIn(state, 'from.data');
    } else {
      path = ownProps.name;
    }
  }

  const scale = getIn(state, path + '.scale');
  const field = getIn(state, path + '.field');
  const scaleName = scale && getInVis(reduxState, 'scales.' + scale + '.name');

  const value = getIn(state, path);

  return {
    group:  getIn(state, path + '.group'),
    signal: getIn(state, path + '.signal'),
    value:  value ? value : ownProps.value,
    field:  field,
    scale:  scale,
    srcField:  dsId && field ?
      getInVis(reduxState, 'datasets.' + dsId + '._schema.' + field + '.source') : false,
    scaleName: scaleName
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OwnProps): DispatchProps {
  return {
    unbind: function() {
      dispatch(resetMarkVisual(ownProps.name, ownProps.primId));
    }
  };
}

class BaseProperty extends React.Component</*OwnProps & StateProps & DispatchProps*/ any> {
  public render() {
    const props = this.props;
    const name  = props.name;
    const label = props.label;
    const type  = props.type;
    const scale = props.scale;
    const field = props.field;
    const unbind = props.unbind;
    let labelEl;
    let scaleEl;
    let controlEl;
    let extraEl;

    React.Children.forEach(props.children, function(child: JSX.Element) {
      const className = child && child.props.className;
      if (className === 'extra') {
        extraEl = child;
      } else if (className === 'control') {
        controlEl = child;
      } else if (type === 'label' || (className && className.indexOf('label') !== -1)) {
        labelEl = child;
      }
    });

    labelEl = labelEl || (<label htmlFor={name}>{label}</label>);
    scaleEl = scale ?
      (<div className='scale' onClick={unbind}>{props.scaleName}</div>) : null;

    controlEl = field ?
      (<div className={'field ' + (props.srcField ? 'source' : 'derived')}
        onClick={unbind}>{field}</div>) : controlEl;

    if (!controlEl) {
      switch (type) {
        case 'autocomplete':
          controlEl = (
            <AutoComplete type={props.autoType} updateFn={props.onChange}
              value={props.value} dsId={props.dsId}/>
          );
          break;
        default:
          controlEl = (
            <FormInputProperty {...props} />
          );
      }
    }

    if (extraEl) {
      extraEl = (<div className='extra'>{extraEl}</div>);
    }

    const className = 'property' + (props.canDrop ? ' can-drop' : '') +
      (props.firstChild ? ' first-child' : '');

    return (
      <div className={className}>
        {labelEl}
        <div className='control'>
          {scaleEl}
          {controlEl}
        </div>
        {extraEl}
      </div>
    );
  }
};
export const Property = connect(mapStateToProps, mapDispatchToProps)(BaseProperty);
