interface KeyOfData {
    a: string;
    b: number;
}
type KeyOfData1 = keyof KeyOfData
const t1:KeyOfData1 = 'a'

/**********原生实现*************/

type KeyOfData2 = 'a' | 'b'
const t2:KeyOfData2 = 'a'