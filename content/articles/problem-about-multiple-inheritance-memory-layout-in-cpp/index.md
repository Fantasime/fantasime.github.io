---
title: "在 Cpp 中遇到的多继承内存布局问题"
slug: "problem-about-multiple-inheritance-memory-layout-in-cpp"
date: '2025-02-04T01:08:04+08:00'
tags:
  - C++

categories:
  - Pending problems
---

## 背景

在写代码时突然好奇，多继承 CRTP 的类会怎么样，于是有了下面的代码。

```c++
template <typename T> class TemplateClass {};

class BaseMixin {
 public:
  virtual void foo() const {}
};

class Base : public TemplateClass<Base> {
 public:
  int val;

  Base() : val(10) {}

  Base(int x) : val(x) {}

  virtual void foo() const {}
};

class Mixin1 : public TemplateClass<Mixin1> {
 public:
  virtual void foo() const {}
};

class Mixin2 : public TemplateClass<Mixin2> {
 public:
  virtual void foo() const {}
};

class Foo : public Base, public Mixin1, public Mixin2 {
 public:
  virtual void foo() const {}
};
```



这份代码运行在 64 位 Windows 上，按照 8 bytes 对齐。我使用的编译器为 clang。

```powershell
PS > clang --version
clang version 19.1.0
Target: x86_64-pc-windows-msvc
Thread model: posix
```



其中，`Base` 大小为 16 bytes；`Mixin1` 大小为 8 bytes；`Mixin2` 大小为 8 bytes。

我预期 `Foo` 的大小应该是 32 bytes，但实际上它是 48 bytes。这点非常令人迷惑，所以我 dump 了一下 `Foo` 的内存布局，如下：

```
*** Dumping AST Record Layout
         0 | class Foo
         0 |   class Base (primary base)
         0 |     (Base vftable pointer)
         8 |     class TemplateClass<class Base> (base) (empty)
         8 |     int val
        24 |   class Mixin1 (base)
        24 |     (Mixin1 vftable pointer)
        32 |     class TemplateClass<class Mixin1> (base) (empty)
        40 |   class Mixin2 (base)
        40 |     (Mixin2 vftable pointer)
        48 |     class TemplateClass<class Mixin2> (base) (empty)
           | [sizeof=48, align=8,
           |  nvsize=48, nvalign=8]
```



可以看到 `Base` 与 `Mixin1` 之间被填充了 8 bytes，`Mixin1` 与 `Mixin2` 之间被填充了 8 bytes。



## 实验

### 交换 primary base

将 `Foo` 的继承顺序进行更换，

```c++
class Foo : public Mixin1, public Mixin2, public Base {
 public:
  virtual void foo() const {}
};
```



此时 `Foo` 的大小仍为 48 bytes。

```
*** Dumping AST Record Layout
         0 | class Foo
         0 |   class Mixin1 (primary base)
         0 |     (Mixin1 vftable pointer)
         8 |     class TemplateClass<class Mixin1> (base) (empty)
        16 |   class Mixin2 (base)
        16 |     (Mixin2 vftable pointer)
        24 |     class TemplateClass<class Mixin2> (base) (empty)
        32 |   class Base (base)
        32 |     (Base vftable pointer)
        40 |     class TemplateClass<class Base> (base) (empty)
        40 |     int val
           | [sizeof=48, align=8,
           |  nvsize=48, nvalign=8]
```



### 非 CRTP 的多继承

不使用 CRTP，只是正常继承一个抽象类。继承结构与之前相同。

```c++
class MixinBase {
 public:
  virtual void foo() {}
};

class Mixin1 : public MixinBase {
 public:
  virtual void foo() {}

  int val;
};

class Mixin2 : public MixinBase {
 public:
  virtual void foo() override {}
};

class Mixin3 : public MixinBase {
 public:
  virtual void foo() override {}
};

class Foo : public Mixin1, public Mixin2, public Mixin3 {};
```



此时 `Foo` 的大小为 32 bytes。

```
*** Dumping AST Record Layout
         0 | class Foo
         0 |   class Mixin1 (primary base)
         0 |     class MixinBase (primary base)
         0 |       (MixinBase vftable pointer)
         8 |     int val
        16 |   class Mixin2 (base)
        16 |     class MixinBase (primary base)
        16 |       (MixinBase vftable pointer)
        24 |   class Mixin3 (base)
        24 |     class MixinBase (primary base)
        24 |       (MixinBase vftable pointer)
           | [sizeof=32, align=8,
           |  nvsize=32, nvalign=8]
```

