type MyExtract<T, U> = T extends U ? T : never;
type Test3 = Extract<Data7,Data4>
type Test4 = MyExtract<Data7,Data4>