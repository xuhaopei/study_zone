interface ReadOnlyData1  {
    a: string;
    b: number;
}
type ReadOnlyData2 = Readonly<ReadOnlyData1> // { readonly  a: string;  readonly b: string; }

/********************原生实现***************************/

type MyReadonly<T> = { 
    readonly [P in keyof T]: T[P]; 
}
// 说明
// [P in keyof T] 等价于 [P in a | b] 等价于 a、b, in 后面只能接 a 或者 a | b这种联合类型
// T[P] 等价于 ReadOnlyData1[a] 、 ReadOnlyData1[b] 等价于 string、 number
// 最后为 a:string、b:number

// 测试
type MyReadonlyTest1 = {
    [P in 'a' | 'b'] : string;
}
const d:MyReadonlyTest1 = {
    a: "",
    b: "",
}