interface PartialData1  {
    a: string;
    b: number;
}
type PartialData2 = Partial<PartialData1> // { a?: string | undefined;   b?: string | undefined; }

/********************原生实现***************************/

type MyPartial<T> = { 
    [P in keyof T]?: T[P] | undefined; 
}
type PartialData3 = MyPartial<PartialData1>
