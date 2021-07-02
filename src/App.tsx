import React from 'react';
import Api from './Api';
import { Container, Sidebar, Breadcrumb, Header, Content, Tree, Icon } from 'rsuite';
import StdApi from './components/StdApi';
import OnceIOApiModel from './model/OnceIOApiModel';
import 'rsuite/dist/styles/rsuite-dark.css'
import './App.css'

class App extends React.Component {
  state = {
    collapsed: true,
    meta: new OnceIOApiModel(),
    apiTree: [],
    api: '',
    apiIndex: ''
  };
  componentDidMount() {
    Api.get('docs/apis').then((resp: any) => {
      let data = resp.data;
      let meta = this.state.meta;

      meta.api = data.api;
      for (let x in data.model) {
        meta.model.set(x, data.model[x]);
      }

      let metaApi = meta.api || [];
      let apiIdx = 0;
      let apiTree = [];
      for (let item of metaApi) {
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
        apiTree.push({
          value: '' + apiIdx,
          label: menuKey,
          children: children
        });
        apiIdx++;
      }
      let menuTree = [
        {
          value: '$setting',
          label: (<span><Icon icon="setting" /> Setting</span>),
        },
        {
          value: '$api' + apiIdx,
          label: (<span><Icon icon="setting" /> Api</span>),
          children: apiTree
        }
      ];
      this.setState({ meta: meta, apiTree: menuTree });
    });
  }
  onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  onSelectMenu = (activeNode: any, value: any, event: any) => {
    if(value === '$setting'){
    } else if(value === '$api'){
    } else {
      let apiIndex = value.split(',');
      let meta = this.state.meta;
      let curApi = meta.api[apiIndex[0]];
      if (apiIndex.length === 2) {
        let curSubApi = curApi.subApi[apiIndex[1]];
        let api = curApi.api + curSubApi.api;
        this.setState({ api: api, apiIndex: value });
      } else {
        this.setState({ api: curApi.api, apiIndex: value });
      }
    }
  };

  render() {
    const { collapsed, api, apiIndex, meta, apiTree } = this.state;
    let apiIndexArray: any = apiIndex.split(',');
    let sidebarWidth = (collapsed ? 300 : 32);
    return (
      <Container style={{ height: '100%' }}>
        <Sidebar style={{ height: '100%' }} width={sidebarWidth}>
          <Tree data={apiTree} style={{ maxHeight: 'none' }} onSelect={this.onSelectMenu} />
        </Sidebar>
        <Container style={{ height: '100%', overflow: 'auto' }}>
          <Header>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>{api}</Breadcrumb.Item>
            </Breadcrumb>
          </Header>
          <Content>
            <StdApi meta={meta} apiIndex={apiIndexArray} />
          </Content>
        </Container>
      </Container>
    );
  }
}
export default App;