type Data4 = {
    'a': string
    'b': string
}
type Data5 = {
    'a': string
    'c': string
}

type Data7 = Data4 | Data5
type Data8 = Data4

type MyExclued<T, U> = T extends U ? never : T;
type Test1 = Exclude<Data7,Data4>
type Test2 = MyExclued<Data7,Data4>