
import React from 'react';
import { Table, Input, Row, Form, InputNumber, DatePicker, Button, FormControl, FormGroup, ControlLabel, ButtonToolbar, Checkbox, IconButton, Icon, Popover, Whisper, InputGroup, TagGroup, Tag } from 'rsuite';
import TablePagination from 'rsuite/lib/Table/TablePagination';
import Api from './Api';
import { ApiModel, FieldModel, OnceIOApiModel, ServiceModel } from './OnceIOApiModel';

import './StdApi.css'


function genericFormItem(field: FieldModel, val: any, showLabel: boolean) {
    let numberType = ['java.lang.Integer', 'java.lang.Short', 'java.lang.Float', 'java.lang.Double', 'int', 'short', 'float', 'double'];
    let dateType = ['java.sql.Date', 'java.sql.Timestamp'];
    let rules = new Array<any>();
    let inputType = <Input placeholder={field.comment} defaultValue={val} />;
    if (numberType.includes(field.type)) {
        inputType = <InputNumber placeholder={field.comment} defaultValue={val} />
    } else if (dateType.includes(field.type)) {
        if ('now()' === val) {
            val = new Date().toISOString();
        } else {
            val = new Date(val).toISOString();
        }
        inputType = <DatePicker showTime placeholder={field.comment} defaultValue={val} />
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
    return (
        <FormGroup>
            <ControlLabel>{showLabel ? field.name : ''}</ControlLabel>
            <FormControl name={field.name} type={inputType}>
            </FormControl>
        </FormGroup>
    );
}

class MetaCell extends React.Component<{ rowData?: any, dataKey: string, type: string }, any>{
    render() {
        const { rowData, dataKey, type } = this.props;
        let showData = rowData[dataKey];
        if (type === 'java.sql.Timestamp') {
            if (!showData) {
                return (
                    <Table.Cell {...this.props}>
                        --
                    </Table.Cell>
                );
            }
            let d = new Date(showData);
            showData = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString();
            return (
                <Table.Cell {...this.props}>
                    {showData}
                </Table.Cell>
            );
        } else if (type == 'image') {
            return (
                <Table.Cell {...this.props}>
                    <img src={showData} width="16" />
                </Table.Cell>
            );
        } else {
            return (
                <Table.Cell {...this.props}>
                    {showData}
                </Table.Cell>
            );
        }
    }
}

class StdApi extends React.Component {
    props = { apiIndex: [], meta: new OnceIOApiModel() };
    last = { apiIndex: [], searchText: '0' };
    state = {
        allChecked: false,
        indeterminate: false,
        showEditableTable: false,
        selectedRowKeys: [],
        editing: false,
        srvApi: new ServiceModel(),
        curApi: new ApiModel(),
        loading: false,
        response: '',
        columns: new Array<any>(),
        formValue: new Object(),
        params: new Object(),
        data: [],
        pagination: {
            current: 0,
            pageSize: 20,
            total: 0,
            pageSizeOptions: [{ label: "20", value: 20 }, { label: "50", value: 50 }, { label: "1000", value: 1000 }]
        }
    };
    constructor(props: any) {
        super(props);
        this.props = props;
    }

    componentDidMount() {
    }
    componentDidUpdate() {
        const { apiIndex } = this.props;
        if (this.last.apiIndex !== apiIndex) {
            this.last.apiIndex = apiIndex;
            this.init();
        }
    }
    forceUpdate() {
    }
    componentDidCatch() {
    }
    isEditing(record: any) {
        const { editing } = this.state;
        return editing;
    }
    init() {
        const { apiIndex } = this.props;
        const { params,pagination } = this.state;
        let args: any = params;
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
                            let align: any = (c.type == 'java.lang.String') ? 'right' : 'left';

                            const speaker = (
                                <Popover title={c.name}>
                                    <InputGroup>
                                        <InputGroup.Addon>=</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$eq'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>

                                    <InputGroup>
                                        <InputGroup.Addon>&lt;</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$lt'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>
                                    <InputGroup>
                                        <InputGroup.Addon>&lt;=</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$le'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>
                                    <InputGroup>
                                        <InputGroup.Addon>&gt;</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$gt'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>
                                    <InputGroup>
                                        <InputGroup.Addon>&ge;</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$ge'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>

                                    <InputGroup>
                                        <InputGroup.Addon>in</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$in'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>

                                    <InputGroup>
                                        <InputGroup.Addon>match</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$match'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>

                                    <InputGroup>
                                        <InputGroup.Addon>reg</InputGroup.Addon>
                                        <Input onChange={(val) => {
                                            args[c.name + '$regexp'] = val;
                                        }}></Input>
                                        <InputGroup.Addon>
                                            <Icon icon="search" onClick={() => { this.onSearch() }} />
                                        </InputGroup.Addon>
                                    </InputGroup>
                                </Popover>
                            );
                            let col = (
                                <Table.Column align={align} resizable width={160}>
                                    <Table.HeaderCell>{c.name}
                                        <Whisper trigger="click" speaker={speaker}>
                                            <IconButton size="xs" icon={<Icon icon="search" />}></IconButton>
                                        </Whisper>
                                    </Table.HeaderCell>
                                    <MetaCell dataKey={c.name} type={c.type} {...this.props} ></MetaCell>
                                </Table.Column>
                            );
                            columns.push(col);
                        }
                    }
                }
                if (apiIndex.length === 1 && srvApi.entityClass != null) {
                    let params: any = { $page: pagination.current, $pageSize: pagination.pageSize };
                    this.setState({ loading: true });
                    Api.get(srvApi.api, { params: params }).then((resp: any) => {
                        let newTotal = resp.data.total || 0;
                        pagination.total = newTotal;
                        this.setState({ srvApi: srvApi, columns: columns, showEditableTable: true, loading: false, data: resp.data.data, pagination });
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

    search(current: number, pageSize: number) {
        const { pagination } = this.state;
        const { srvApi, params } = this.state;
        let args: any = Object.assign({}, params, { $page: current, $pageSize: pageSize });
        if (srvApi && srvApi.api) {
            this.setState({ loading: true });
            Api.get(srvApi.api, { params: args }).then((resp: any) => {
                let newTotal = resp.data.total || pagination.total;
                Object.assign(pagination, { current: current, pageSize: pageSize, total: newTotal } )
                this.setState({ loading: false, data: resp.data.data, pagination});
            });
        } else {
            Object.assign(pagination, { current: 0, pageSize: pageSize, total: 0  } )
            this.setState({ data: [], pagination});
        }
    };

    onSearch = () => {
        const { current, pageSize } = this.state.pagination;
        this.search(1, pageSize);
    };
    onTableChange = (pagination: any) => {
        const { current, pageSize } = pagination;
        this.search(current, pageSize);
    };

    onSelectChange = (selectedRowKeys: any) => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };

    onSubmit = () => {
        const { srvApi, curApi, formValue } = this.state;
        let values: any = formValue;
        let api = srvApi.api + curApi.api;
        if (api.indexOf('{') !== -1) {
            let vars = api.split('{');
            for (let v of vars) {
                if (v.endsWith('}')) {
                    let key = v.substring(0, v.length - 1);
                    api = api.replaceAll(`{${key}}`, values[key]);
                }
            }
        }
        let callback = (resp: any) => {
            this.setState({ response: JSON.stringify(resp.data, null, ' ') });
        };
        switch (curApi.httpMethod) {
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
        const { editing, columns, data, pagination, selectedRowKeys, srvApi, loading, allChecked, indeterminate, params } = this.state;

        const tags = new Array<any>();
        let obj: any = params;
        for (let x in params) {
            let name = x.replace("$", " ") + " " + obj[x];
            tags.push((<Tag closable onClose={() => { delete obj[x]; this.setState({ params: obj });this.onSearch(); }}>{name}</Tag>));
        }

        const self = this;
        return (
            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                <Row>
                    <TagGroup>
                        {tags}
                    </TagGroup>
                </Row>
                <Table rowKey="id" data={data} height={window.screen.height - 300} virtualized>
                    <Table.Column width={64} fixed="left">
                        <Table.HeaderCell>
                            <Checkbox
                                inline
                                checked={allChecked}
                                indeterminate={indeterminate}
                                onChange={() => this.handleCheckAll()}
                            /></Table.HeaderCell>
                        <Table.Cell {...this.props}>
                            {
                                (rowData: any) => (<Checkbox
                                    inline
                                    checked={rowData.$checked}
                                    onChange={() => {
                                        this.handleCheckAll(rowData);
                                    }}
                                />)
                            }

                        </Table.Cell>
                    </Table.Column>
                    {columns}
                    <Table.Column width={120} fixed="right">
                        <Table.HeaderCell>Action</Table.HeaderCell>
                        <Table.Cell>
                            {(rowData: any) => {
                                function handleAction() {
                                    alert(`id:${rowData.id}`);
                                }
                                return (
                                    <span>
                                        <a onClick={handleAction}> Edit </a> |{' '}
                                        <a onClick={handleAction}> Remove </a>
                                    </span>
                                );
                            }}
                        </Table.Cell>
                    </Table.Column>
                </Table>
                <TablePagination
                    lengthMenu={pagination.pageSizeOptions}
                    activePage={pagination.current}
                    displayLength={pagination.pageSize}
                    total={pagination.total}
                    onChangePage={(page) => this.onTableChange({ current: page, pageSize: pagination.pageSize })}
                    onChangeLength={(pageSize) => this.onTableChange({ current: pagination.current, pageSize })}
                />
            </div>);
    }

    handleCheckAll(rowData?: any) {
        const { data } = this.state;
        if (rowData) {
            rowData.$checked = !rowData.$checked;
        } else {
            for (let row of data) {
                let item: any = row;
                item.$checked = !item.$checked;
            }
        }
        let allUncecked = true;
        let allChecked = true;
        for (let row of data) {
            let item: any = row;
            if (item.$checked) {
                allUncecked = false;
            } else {
                allChecked = false;
            }
        }
        this.setState({ allChecked, indeterminate: (!allChecked && !allUncecked), data });
    }


    renderApi() {
        const { srvApi, curApi, response } = this.state;
        const { meta } = this.props;
        let result: any = [];
        let paramItems: any = [];
        let returnType: any = {};
        let api = curApi.httpMethod + ":" + srvApi.api + curApi.api;
        result.push((<p>api: {api}</p>));
        result.push((<p>Brief:<p>{srvApi.brief}</p><p>{curApi.brief}</p></p>));
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
        result.push((<Form layout="horizontal">
            {paramItems}
            <FormGroup>
                <ButtonToolbar><Button appearance="primary" onClick={this.onSubmit}>Submit</Button></ButtonToolbar>
            </FormGroup>
        </Form>));

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