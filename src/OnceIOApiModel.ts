
export class OnceIOApiModel {
    api: Array<ServiceModel>  = new Array<ServiceModel>();
    model: Map<string, TypeModel> = new Map<string, TypeModel>();
}

export class ServiceModel {
    name: string  = '';
    api: string  = '';
    brief: string  = '';
    entityClass: string  = '';
    subApi: Array<ApiModel> = new Array<ApiModel>();
}

export class ApiModel {
    name: string = '';
    api: string = '';
    brief: string = '';
    httpMethods: Array<string> = new Array<string>();
    params: Array<FieldModel> = new Array<FieldModel>();
    returnType: string = '';
}
export class TypeModel {
    type: string = '';
    fields: Array<FieldModel> = new Array<FieldModel>();
}

export class FieldModel {
    type: string = '';
    name: string = '';
    comment: string = '';
    nullable: boolean = false;
    pattern: string = '';
    defaultValue:string = '';
    ref: string = '';
    source: string = '';
}

export default OnceIOApiModel;