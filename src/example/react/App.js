import React from "react";
// import Rescope, {Store} from "../../Rescope";
let ReactDom      = require('react-dom'),
    Rescope       = require('../../Rescope'),
    Store         = Rescope.Store,
    NewsListComp  = require('./NewsListComp'),
    StoresContext = require('../StoresContext');

Store.staticContext = StoresContext();

class App extends React.Component {
    static renderTo = ( node ) => {
        Rescope.fetch(
            (err, state, context)=>{
                ReactDom.render(<App/>, node);
            }
        )

    }

    state = {};

    componentWillMount() {
        // init using a dedicated store instance
        this._store = new Store(["status", "session"]);
        this._store.bind(this);
        this.stores = this._store.stores;

        // or using static Store.map fn
        // this.stores = {};// stores refs are automaticly added in the store hashmap if .stores exist
        // Store.map(this, ["status", "session"])
    }

    render() {
        let session = this.stores.session;
        return (
            <div>
                <h1>Really basic drafty rescope + react mini app example</h1>

                <div style={{border : "solid 1px lightgrey", borderRadius : "3px"}}>
                    <b><u><button
                        onClick={() => session.setState(
                            {currentUserId : 'MissTick'})}>MissTick events</button></u></b>&nbsp;&nbsp;
                    <b><u><button
                        onClick={() => session.setState({currentUserId : 'MrNice'})}>MrNice events</button></u></b>
                </div>
                <pre>
                  {this.state.status && JSON.stringify(this.state.status, null, 2)}
                </pre>
                <NewsListComp/>

            </div>
        );
    }
}

window.App = App;