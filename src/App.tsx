import React from 'react';
import Api from './Api';
import { Container, Sidebar, Breadcrumb, Header, Content, Tree } from 'rsuite';
import StdApi from './StdApi';
import OnceIOApiModel from './OnceIOApiModel';
import 'rsuite/dist/styles/rsuite-default.css'
import './App.css'

class App extends React.Component {
  state = {
    collapsed: true,
    meta: new OnceIOApiModel(),
    api: '',
    apiIndex: []
  };
  componentDidMount() {
    Api.get('docs/apis').then((resp: any) => {
      let data = resp.data;
      let meta = this.state.meta;

      meta.api = data.api;
      for (let x in data.model) {
        meta.model.set(x, data.model[x]);
      }
      this.setState({ meta: meta });
    });
  }
  onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  onSelectMenu = (evt: any) => {
    let apiIndex = evt.value.split(',');
    let meta = this.state.meta;
    let curApi = meta.api[apiIndex[0]];
    if(apiIndex.length == 2){
      let curSubApi = curApi.subApi[apiIndex[1]];
      let api = curApi.api + curSubApi.api;
      this.setState({ api: api, apiIndex: apiIndex });
    } else {
      this.setState({ api: curApi.api, apiIndex: apiIndex });
    }
  };

  render() {
    const { collapsed, apiIndex } = this.state;
    let meta = this.state.meta || new OnceIOApiModel();
    let api = meta.api || [];
    let apiIdx = 0;
    let data = [];
    for (let item of api) {
      let menuKey = item.api || '/';
      let subApiIndex = 0;
      let children = new Array<any>();
      for (let sub of item.subApi) {
        let itemKey = apiIdx + "," + subApiIndex++;
        let itemTitle = sub.httpMethod + ":" + item.api + sub.api;
        children.push({
          value: itemKey,
          label: itemTitle
        });
      }
      data.push({
        value: ''+apiIdx,
        label: menuKey,
        children: children
      });
      apiIdx++;
    }
    return (
      <Container style={{ height: '100%' }}>
        <Sidebar style={{ height: '100%' }}>
            <Tree data={data} style={{maxHeight: 'none'}} onSelect={this.onSelectMenu}/>
        </Sidebar>
        <Container>
          <Header>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>{this.state.api}</Breadcrumb.Item>
            </Breadcrumb>
          </Header>
          <Content>
            <StdApi meta={this.state.meta} apiIndex={this.state.apiIndex} />
          </Content>
        </Container>
      </Container>
    );
  }
}
export default App;