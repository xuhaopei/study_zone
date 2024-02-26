// 作为泛型得条件判断, 类似 三元判断， 如果 T 符合 Data3 那么类型就为Data1 否则就为 Data2
type Data1 = string | number;
type Data2 = undefined;
type Data3 = string [] | null;
type TextExtends<T> = T extends Data3 ? Data1 : Data2; 

type test1 = TextExtends<number>
