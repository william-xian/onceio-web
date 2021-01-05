
import React from 'react';
import 'antd/dist/antd.css';
import './index.css';
import { Table, Input, Row, Form, InputNumber, DatePicker, Button } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import Api from './Api';
import { ApiModel, FieldModel, OnceIOApiModel, ServiceModel } from './OnceIOApiModel';
import { Rule } from 'antd/lib/form';

const { Search } = Input;

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
    editing: boolean;
    dataIndex: string;
    title: any;
    meta: FieldModel;
    index: number;
    children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    dataIndex,
    title,
    meta,
    index,
    children,
    ...restProps
}) => {
    let val: any;
    if (children instanceof Array) {
        val = children[1];
    }
    if (editing) {
        let formItem = genericFormItem(meta || new FieldModel(), val, false);
        return (<td {...restProps}>{formItem}</td>);
    } else {
        return (<td {...restProps}>{children}</td>);
    }
};


function genericFormItem(field: FieldModel, val: any, showLabel: boolean) {
    let numberType = ['java.lang.Integer', 'java.lang.Short', 'java.lang.Float', 'java.lang.Double', 'int', 'short', 'float', 'double'];
    let dateType = ['java.sql.Date', 'java.sql.Timestamp'];
    let rules = new Array<Rule>();
    let inputType = <Input placeholder={field.comment} defaultValue={val} />;
    if (numberType.includes(field.type)) {
        inputType = <InputNumber placeholder={field.comment} defaultValue={val} />
    } else if (dateType.includes(field.type)) {
        if ('now()' === val) {
            val = new Date().toISOString();
        } else {
            val = new Date(val).toISOString();
        }
        inputType = <DatePicker showTime placeholder={field.comment} defaultValue={moment(val, 'YYYY-MM-DD HH:mm:ss')} />
    }
    rules.push({
        required: !field.nullable,
        message: `Please Input ${field.name}!`,
    });
    if (field.pattern) {
        rules.push(
            {
                pattern: new RegExp(field.pattern),
                message: `${field.name} is not matched ${field.pattern}!`,
            });
    }
    return (<Form.Item
        label={showLabel ? field.name : ''}
        name={field.name}
        style={{ margin: 0 }}
        rules={rules}
    >
        {inputType}
    </Form.Item>)
}


class StdApi extends React.Component {
    props = { apiIndex: [], meta: new OnceIOApiModel() };
    last = { apiIndex: [], searchText: '0' };
    state = {
        showEditableTable: false,
        selectedRowKeys: [],
        editing: false,
        srvApi: new ServiceModel(),
        curApi: new ApiModel(),
        loading: false,
        response: '',
        searchText: '',
        columns: new Array<any>(),
        data: [],
        pagination: {
            current: 0,
            pageSize: 10,
            total: 0,
            pageSizeOptions: ["10", "20", "50", "100"]
        }
    };
    constructor(props: any) {
        super(props);
        this.props = props;
        console.log("constructor", props);
    }

    componentDidMount() {
        console.log("componentDidMount", this.props);
    }
    componentDidUpdate() {
        console.log("componentDidUpdate", this.props);
        const { apiIndex } = this.props;
        if (this.last.apiIndex !== apiIndex) {
            this.last.apiIndex = apiIndex;
            this.init();
        }
    }
    forceUpdate() {
        console.log("forceUpdate", this.props);
    }
    componentDidCatch() {
        console.log("componentDidCatch", this.props);
    }
    isEditing(record: any) {
        const { editing } = this.state;
        return editing;
    }
    init() {
        const { apiIndex } = this.props;
        const { current, pageSize, total } = this.state.pagination;

        if (apiIndex.length >= 1) {
            let meta: OnceIOApiModel = this.props.meta;
            let srvApi: ServiceModel = meta.api[apiIndex[0]];
            let columns = new Array<any>();
            if (srvApi) {
                if (srvApi.entityClass != null) {
                    let map = meta.model;
                    let model = map.get(srvApi.entityClass);
                    if (model) {
                        for (let c of model.fields) {
                            let col: any = {
                                title: c.name,
                                dataIndex: c.name,
                                key: 'id',
                                fixed: 'left',
                                onCell: (record: any) => {
                                    return ({
                                        record,
                                        meta: c,
                                        dataIndex: c.name,
                                        title: c.name,
                                        editing: this.isEditing(record),
                                    });
                                },
                            };
                            columns.push(col);
                        }
                    }
                }
                if (apiIndex.length === 1 && srvApi.entityClass != null) {
                    let params: any = { $page: current, $pageSize: pageSize };
                    this.setState({ loading: true });
                    Api.get(srvApi.api, { params: params }).then((resp: any) => {
                        let newTotal = resp.data.total || total;
                        this.setState({ srvApi: srvApi, columns: columns, showEditableTable: true, loading: false, data: resp.data.data, pagination: { total: newTotal } });
                    });
                } else if (apiIndex.length === 2) {
                    let curApi = srvApi.subApi[apiIndex[1]];
                    this.setState({ srvApi: srvApi, curApi: curApi, columns: columns, showEditableTable: false, response: '', loading: false });
                }
            } else {
                console.error('错误')
            }
        }

    }

    search(current: number, pageSize: number, searchText: string) {
        const { total } = this.state.pagination;
        const { srvApi } = this.state;
        let params: any = { $page: current, $pageSize: pageSize };

        if (searchText !== '') {
            if (this.last.searchText !== searchText) {
                params.$page = 0;
            }
            this.last.searchText = searchText;
            for (let kvStr of searchText.split(";")) {
                let kv = kvStr.split(":");
                if (kv.length === 2) {
                    params[kv[0].trim()] = kv[1].trim();
                }
            }
        }

        if (srvApi && srvApi.api) {
            this.setState({ loading: true });
            Api.get(srvApi.api, { params: params }).then((resp: any) => {
                let newTotal = resp.data.total || total;
                this.setState({ loading: false, data: resp.data.data, pagination: { total: newTotal } });
            });
        } else {
            this.setState({ data: [], pagination: { current: 1, pageSize: pageSize, total: 0 } });
        }
    };

    onSearch = (evt: any) => {
        this.setState({ searchText: evt });
        const { current, pageSize } = this.state.pagination;
        this.search(current, pageSize, evt);
    };
    onTableChange = (pagination: any) => {
        this.setState({ pagination: pagination });
        const { current, pageSize } = this.state.pagination;
        const { searchText } = this.state;
        this.search(current, pageSize, searchText);
    };

    onSelectChange = (selectedRowKeys: any) => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };

    onFinish = (values: any) => {
        console.log(values);
        const { srvApi, curApi } = this.state;
        let api = srvApi.api + curApi.api;
        if (api.indexOf('{') !== -1) {
            api = eval('`' + api.replace('{', '${values.') + '`');
        }
        let callback = (resp: any) => {
            this.setState({ response: JSON.stringify(resp.data, null, ' ') });
        };
        switch (curApi.httpMethods[0]) {
            case "GET":
                Api.get(api, { params: values }).then(callback);
                break;
            case "POST":
                Api.post(api, { data: values }).then(callback);
                break;
            case "PATCH":
                Api.patch(api, { data: values }).then(callback);
                break;
            case "PUT":
                Api.put(api, { data: values }).then(callback);
                break;
            case "DELETE":
                Api.delete(api, { params: values }).then(callback);
                break;
        }
    }



    renderStdApi() {
        const { editing, columns, data, pagination, selectedRowKeys, srvApi, loading } = this.state;
        const self = this;
        const rowSelection = {
            selectedRowKeys,
            columnWidth: "65px",
            onChange: this.onSelectChange,
            selections: [
                Table.SELECTION_INVERT,
                {
                    key: 'delete',
                    text: 'Delete selected rows',
                    onSelect: (changableRowKeys: any) => {
                        let params = { "id$in": selectedRowKeys.join(",") };
                        Api.delete(srvApi.api, { params: params }).then((resp: any) => {
                            this.setState({ loading: false });
                        });
                    },
                },
                {
                    key: 'editable',
                    text: 'Editable switch',
                    onSelect: (changeableRowKeys: any) => {
                        this.setState({ editing: !editing });
                    },
                },
                {
                    key: 'save',
                    text: 'Save selected rows',
                    onSelect: (changeableRowKeys: any) => {
                        console.log(changeableRowKeys);
                    },
                }
            ],
            onSelect: (record: any, selected: any, selectedRows: any, nativeEvent: any) => {
                console.log(selected, selectedRows);
            }
        };
        return (
            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                <Row>
                    <Search placeholder="input search text" onSearch={self.onSearch} enterButton />
                </Row>

                <Table
                    components={{
                        body: {
                            cell: EditableCell
                        },
                    }}
                    bordered
                    dataSource={data}
                    columns={columns}
                    rowSelection={rowSelection}
                    rowKey="id"
                    rowClassName="editable-row"
                    pagination={pagination}
                    loading={loading}
                    onChange={this.onTableChange}
                />
            </div>);
    }



    renderApi() {
        const { srvApi, curApi, response } = this.state;
        const { meta } = this.props;
        const layout = {
            labelCol: { span: 2 },
            wrapperCol: { span: 8 },
          };
          const tailLayout = {
            wrapperCol: { offset: 8, span: 16 },
          };
        let result: any = [];
        let paramItems: any = [];
        let returnType: any = {};
        let api = curApi.httpMethods + ":" + srvApi.api + curApi.api;
        result.push((<h2>api: {api}</h2>));
        result.push((<h2>Brief:<p>{srvApi.brief}</p><p>{curApi.brief}</p></h2>));
        for (let x of curApi.params) {
            let model = meta.model.get(x.type);
            if (model != null && model.fields != null) {
                for (let field of model.fields) {
                    let item = genericFormItem(field, field.defaultValue, true);
                    paramItems.push(item);
                }
            } else {
                let item = genericFormItem(x, x.defaultValue, true);
                paramItems.push(item);
            }
        }
        result.push((<Form {...layout} onFinish={this.onFinish}>
            {paramItems}
            <Form.Item wrapperCol={{ span: 4, offset: 2 }}>
                <Button type="primary" htmlType="submit">
                    Submit
            </Button>
            </Form.Item></Form>));
        let responseDisplay = response;
        if (!response) {
            let model = meta.model.get(curApi.returnType);
            if (model != null && model.fields != null) {
                for (let field of model.fields) {
                    returnType[field.name] = field.type;
                }
            } else {
                returnType = curApi.returnType;
            }
            responseDisplay = JSON.stringify(returnType, null, ' ');
        }
        result.push((<pre>{responseDisplay}</pre>));
        return result;
    }

    render() {
        const { showEditableTable, curApi } = this.state;
        if (showEditableTable) {
            return this.renderStdApi();
        } else if (curApi && curApi.api !== '') {
            return this.renderApi();
        } else {
            return (<div />);
        }
    }

}

export default StdApi;