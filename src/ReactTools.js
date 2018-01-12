/*
 * Copyright (c)  2018 Wise Wild Web .
 *
 *  MIT License
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *  
 * @author : Nathanael Braun
 * @contact : caipilabs@gmail.com
 */

import React from 'react'
import is from 'is'
import PropTypes from 'prop-types';
import Scope from './Scope';

/**
 * Inheritable ReScope "HOC" (High Order Component)
 *
 * @class Component
 * @desc Parent React Component with store injection in its state
 */
class Component extends React.Component {
    static childContextTypes = {
        rescope: PropTypes.object,
        $stores: PropTypes.object
    }
    static contextTypes      = {
        rescope: PropTypes.object,
        $stores: PropTypes.object
    }
    
    constructor( p, ctx, q ) {
        super(p, ctx, q);
        if ( this.constructor.use ) {
            this.state = {
                ...this.state,
                ...ctx.rescope.map(this, this.constructor.use || [], false)// don't bind
            }
        }
        else this.render = () => <div>No Rescope here { super.name }</div>
    }
    
    componentWillMount() {
        if ( this.constructor.use ) {
            this.context.rescope.bind(this, this.constructor.use || [], false)
        }
    }
    
    componentWillUnmount() {
        this.constructor.use
        && this.context.rescope.unBind(this, this.constructor.use || [])
    }
    
    componentWillReceiveProps( np, nc ) {
        if ( nc.rescope !== this.context.rescope ) {
            this.constructor.use
            && this.context.rescope.unBind(this, this.constructor.use || []);
            this.constructor.use
            && nc.rescope.bind(this, this.constructor.use || []);
        }
    }
    
    getChildContext() {
        return {
            rescope: this.context.rescope,
            $stores: this.context.$stores
        };
    }
    
    render() {
        return this.props.children || <div/>
    }
};

/**
 * Return a React "HOC" (High Order Component) that :
 *  - Inherit BaseComponent,
 *  - Inject & maintain the stores in BaseComponent::use and/or (use) in the instances state.
 *  - Propag (scope) in the returned React Component context
 *
 *
 * @param BaseComponent {React.Component} Base React Component ( default : React.Component )
 * @param scope {ReScope.Scope|function} the propagated Scope where the stores will be searched
 * @param use {array} the list of stores injected from the current scope
 * @returns {ReScopeProvider}
 */
function reScopeState( BaseComponent = React.Component, scope, use ) {
    if ( is.array(BaseComponent) ) {
        use           = BaseComponent;
        BaseComponent = React.Component;
    }
    if ( BaseComponent instanceof Scope || is.fn(BaseComponent) && !BaseComponent.prototype.isReactComponent ) {
        scope         = BaseComponent;
        BaseComponent = React.Component;
    }
    if ( !use && is.array(scope) ) {
        use   = scope;
        scope = null;
    }
    
    use = [...(BaseComponent.use || []), ...(use || [])];
    
    return class ReScopeProvider extends BaseComponent {
        static childContextTypes = {
            ...(BaseComponent.childContextTypes || {}),
            rescope: PropTypes.object,
            $stores: PropTypes.object
        }
        static contextTypes      = {
            ...(BaseComponent.contextTypes || {}),
            rescope: PropTypes.object,
            $stores: PropTypes.object
        }
        static defaultProps      = {
            ...(BaseComponent.defaultProps || {}),
        }
        
        constructor( p, ctx, q ) {
            super(p, ctx, q);
            this.$scope = is.fn(scope) && scope(this) || scope || ctx.rescope;
            is.fn(scope)
            && this.$scope.retain()
            if ( this.$scope && use.length ) {
                this.state   = {
                    ...this.state,
                    ...this.$scope.map(this, use, false)// don't bind now due to SSR
                }
                this.$stores = this.$scope.stores;
            }
            else this.render = () => <div>No Rescope here { BaseComponent.name }</div>
        }
        
        dispatch( ...argz ) {
            this.$scope.dispatch(...argz)
        }
        
        componentWillMount() {
            if ( use.length ) {
                this.$scope.bind(this, use, false)
                
            }
            super.componentWillMount && super.componentWillMount()
        }
        
        componentWillUnmount() {
            super.componentWillUnmount && super.componentWillUnmount()
            use.length
            && this.$scope.unBind(this, use);
            is.fn(scope)
            && this.$scope.dispose();
            delete this.$stores;
            delete this.$scope;
        }
        
        componentWillReceiveProps( np, nc ) {
            if ( use.length && !scope && nc.rescope !== this.context.rescope ) {
                this.context.rescope.unBind(this, use);
                this.$scope  = nc.rescope;
                this.$stores = this.$scope.stores;
                nc.rescope.bind(this, use);
            }
            super.componentWillReceiveProps && super.componentWillReceiveProps(np, nc);
        }
        
        getChildContext() {
            let ctx = super.getChildContext && super.getChildContext() || {};
            return {
                ...ctx,
                rescope: this.$scope,
                $stores: this.$scope.stores
            };
        }
    }
}

/**
 * Return a React "HOC" (High Order Component) that :
 *  - Inject & maintain the stores listed baseComponent::use and/or (use) in the instances props.
 *  - Propag (scope) in the returned React Component context
 *
 * @param BaseComponent {React.Component} Base React Component ( default : React.Component )
 * @param scope {ReScope.Scope|function} the propagated Scope where the stores will be searched ( default : the default
 *     ReScope::Scope::scopes.static scope )
 * @param use {array} the list of stores to inject from the current scope
 * @returns {ReScopeProvider}
 */
function reScopeProps( BaseComponent, scope, use ) {
    if ( !use && is.array(scope) ) {
        use   = scope;
        scope = null;
    }
    use = [...(BaseComponent.use || []), ...(use || [])];
    return reScopeState(class ReScopePropsProvider extends React.Component {
        static use               = use;
        static childContextTypes = {
            ...(BaseComponent.contextTypes || {}),
            rescope: PropTypes.object,
            $stores: PropTypes.object
        };
        static contextTypes      = {
            ...(BaseComponent.contextTypes || {}),
            rescope: PropTypes.object,
            $stores: PropTypes.object
        };
        
        getChildContext() {
            return this.context;
        }
        
        render() {
            return <BaseComponent { ...this.props }
                                  { ...this.state }
                                  dispatch={ this.props.dispatch }
                                  $stores={ this.$stores }/>
        }
    }, scope);
}

export {
    Component as default,
    Component,
    reScopeProps,
    reScopeProps as rescopeProps,
    reScopeState,
    reScopeState as rescopeState
};