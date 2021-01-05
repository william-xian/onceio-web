import React from 'react';
import Api from './Api';
import 'antd/dist/antd.css';
import './index.css';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
  DesktopOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import StdApi from './StdApi';
import OnceIOApiModel from './OnceIOApiModel';


const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

class App extends React.Component {
  state = {
    collapsed: false,
    meta: new OnceIOApiModel(),
    api: '',
    apiIndex: []
  };
  componentDidMount() {
    Api.get('docs/apis').then((resp: any) => {
      let data = resp.data;
      let meta = this.state.meta;

      meta.api = data.api;
      for(let x in data.model) {
        meta.model.set(x, data.model[x]);
      }
      this.setState({ meta: meta });
    });
  }
  onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  onEntity = (evt: any) => {
    let apiIndex = evt.key.split(',');
    let meta: any = this.state.meta;
    let curApi = meta.api[apiIndex[0]];
    this.setState({ api: curApi.api, apiIndex: apiIndex });
  };

  onSelectMenu = (evt: any) => {
    let apiIndex = evt.key.split(',');
    let meta: any = this.state.meta;
    let curApi = meta.api[apiIndex[0]];
    let curSubApi = curApi.subApi[apiIndex[1]];
    let api = curApi.api + curSubApi.api;
    this.setState({ api: api, apiIndex: apiIndex});
  };

  render() {
    const { collapsed } = this.state;
    let apiMenu = [];
    let meta: any = this.state.meta || {};
    let api = meta.api || [];
    let apiIndex = 0;
    for (let item of api) {
      let menuKey = item.api || '/';
      let menuItems = [];
      let subApiIndex = 0;
      for (let sub of item.subApi) {
        let itemKey = apiIndex + "," + subApiIndex++;
        let itemTitle = sub.httpMethods.join('|') + ":" + item.api + sub.api;
        menuItems.push((<Menu.Item key={itemKey} onClick={this.onSelectMenu} >{itemTitle}</Menu.Item>));
      }
      apiMenu.push((<SubMenu key={apiIndex} title={menuKey} onTitleClick={this.onEntity} >{menuItems}</SubMenu>));
      apiIndex++;
    }


    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
          <div className="logo" />
          <Menu theme="dark" defaultSelectedKeys={['m-1']} mode="inline">
            <Menu.Item key="m-1" icon={<PieChartOutlined />}>
              Option 1
            </Menu.Item>
            <Menu.Item key="m-api" icon={<DesktopOutlined />}>
              API
            </Menu.Item>
            {apiMenu}
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }} />
          <Content style={{ margin: '0 16px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>{this.state.api}</Breadcrumb.Item>
            </Breadcrumb>
            <StdApi meta={this.state.meta} apiIndex={this.state.apiIndex} />
          </Content>
          <Footer style={{ textAlign: 'center' }}>Xian</Footer>
        </Layout>
      </Layout>
    );
  }
}
export default App;