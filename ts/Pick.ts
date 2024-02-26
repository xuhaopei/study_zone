interface PickData1  {
    a: string;
    b: number;
    c: undefined;
}
type PicklData2 = Pick<PickData1, 'a' | 'b'> // { a:string, b:number }

/********************原生实现***************************/

type MyPick<T, K extends keyof T> = {  
    [P in K]: T[P]; 
}
// 说明
// K extends keyof T 表示 k只能是T的key的子集，也就是说 K 等于 a 或者 a|b 再或者 a|b|c 
// 故此在上面的例子中 [p in k] === [p in 'a' | 'b']
type PicklData3 = MyPick<PickData1, 'a' | 'b'>
