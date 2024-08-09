package main

import "fmt"

func test() (int, string) {
	return 1, "string"
}

type FormatFun func(s string) string

func test1(fn FormatFun, s string) {
	fn(s)
}
func test2(list *[]int) {
	*list = append(*list, 3)
}
func add(a, b int) int {
	// c = a + b
	return 1
}
func main() {

	// test3 := func (a int) int{
	// 	return a
	// }
	test4 := add
	fmt.Println(test4(4, 5))
}

// func getVal1(val int, accpet chan int) {
// 	time.Sleep(1 * time.Second)
// 	accpet <- val
// }
// func getVal2(val int, accpet chan int) {
// 	time.Sleep(1 * time.Second)
// 	accpet <- val
// }
// func getRandomNum(list []int, m int) {
// 	fmt.Printf("list : %p , %v\n", &list, list)
// 	size := len(list)
// 	cMap := make(map[int]bool, m)
// 	getRandSize := 0
// 	for getRandSize != m {
// 		randVal := rand.Intn(size)
// 		if !cMap[randVal] {
// 			getRandSize++
// 			cMap[randVal] = true
// 		}
// 	}
// 	// for k, _ := range cMap {
// 	// 	fmt.Println(list[k])
// 	// }
// }

//	type Person struct {
//		name      string
//		city      string
//		year, sex int8
//	}
//
//	type student struct {
//		name string
//		age  int
//	}
//
// 声明结构体

// selece语句
// func main() {
// 	a, b, c := make(chan int), make(chan int), make(chan int)
// 	go func() {
// 		time.Sleep(1 * time.Second)
// 		a <- 1
// 	}()
// 	go func() {
// 		time.Sleep(1 * time.Second)
// 		b <- 2
// 	}()
// 	go func() {
// 		time.Sleep(1 * time.Second)
// 		c <- 3
// 	}()
// 	select {
// 	case <-a:
// 		fmt.Println('a')
// 	case <-b:
// 		fmt.Println('b')
// 	case <-c:
// 		fmt.Println('c')
// 	}
// }
