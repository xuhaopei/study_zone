package main

import (
	"fmt"
	"math/rand"
	"time"
)

func getVal1(val int, accpet chan int) {
	time.Sleep(1 * time.Second)
	accpet <- val
}
func getVal2(val int, accpet chan int) {
	time.Sleep(1 * time.Second)
	accpet <- val
}
func getRandomNum(list []int, m int) {
	fmt.Printf("list : %p , %v\n", &list, list)
	size := len(list)
	cMap := make(map[int]bool, m)
	getRandSize := 0
	for getRandSize != m {
		randVal := rand.Intn(size)
		if !cMap[randVal] {
			getRandSize++
			cMap[randVal] = true
		}
	}
	// for k, _ := range cMap {
	// 	fmt.Println(list[k])
	// }
}

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

func main() {
	a, b, c := make(chan int), make(chan int), make(chan int)
	go func() {
		time.Sleep(1 * time.Second)
		a <- 1
	}()
	go func() {
		time.Sleep(1 * time.Second)
		b <- 2
	}()
	go func() {
		time.Sleep(1 * time.Second)
		c <- 3
	}()
	select {
	case <-a:
		fmt.Println('a')
	case <-b:
		fmt.Println('b')
	case <-c:
		fmt.Println('c')
	}
}
