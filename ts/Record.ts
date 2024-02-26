interface RecordData1  {
    a: string;
    b: number;
    c: undefined;
}
type RecordData2 = Record<'a' | 'b', RecordData1> // { a:RecordData1, b:RecordData1 }

/********************原生实现***************************/

type MyRecord<T extends string | number | symbol, U> = {  
    [P in T]: U; 
}
// 说明
// T extends string | number | symbol , 此时T为联合类型
// 故此在上面的例子中 [p in k] === [p in 'a' | 'b']
type PickData3 = MyRecord<'a' | 'b', RecordData1> 
 