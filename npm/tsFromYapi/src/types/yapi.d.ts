// 获取某个分类下接口列表 https://hellosean1025.github.io/yapi/openapi.html
interface YapiQueryListCat {
    token: string,//项目token
    catid: number,//分类id
    page?: number,//当前页面
    limit?: number,//每页数量，默认为10，如果不想要分页数据，可将 limit 设置为比较大的数字，比如 1000
}
interface YapiResponseListCat {
    data: {
        errcode: number,
        errmsg: string,
        data: {
            count: number,
            total: number,
            list: Array<{
                edit_uid: number,
                status: string,
                api_opened: boolean,
                tag: Array<unknown>,
                _id: number,
                method: string, // 'POST'
                catid: number,
                title: string,
                path: string,   // '/api_service/v1/go/boss/seckill/goods/add',
                project_id: number,
                uid: number,
                add_time: number
            }>
        },
    }
}
// 获取接口数据（有详细接口数据定义文档） https://hellosean1025.github.io/yapi/openapi.html
interface Row {
    [keyName: string]: {
        type: string, // 属性类型   eg:number/string
        description: string // 对属性的描述 eg:商品名称
    }
}
interface ReqQueryItem {
    required: number,// 是否必填，eg:1 , 0
    name: string,  // eg:change_type
    example: string, // eg:privileges
    desc: string, // eg:兑换类型（privileges、goods、others）
}
interface ReqBodyOther {
    required: Array<string>, //必填的字段集合
    properties: { [keyName: string]: { description: string } },  // 字段的信息
}
interface YapiQueryGet {
    id: number,
    token: string,
}
interface YapiResponseGet {
    data: {
        errcode: number,
        errmsg: string,
        data: {
            [keyName: string]: any,
            req_query: Array<ReqQueryItem>,
            res_body: string, // 响应的body
        },
    }
}


