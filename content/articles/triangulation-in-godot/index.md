---
title: "Godot 中的三角剖分"
slug: "triangulation-in-godot"
date: '2025-04-28T03:56:00+08:00'
params:
  math: true
tags:
  - 计算机图形学

categories:
  - Godot
---



## TL; DR

截至 4.4.1 版本，Godot 使用耳切法对简单多边形进行三角剖分。时间复杂度为 $\Omicron(n^2)$。

源码位置为：

```shell
core/math/triangulate.cpp
bool Triangulate::triangulate(const Vector<Vector2> &contour, Vector<int> &result)
```



## 源码

### 整体流程

即耳切法的算法流程：

1. 构建有序点集 `V`，其中包含了简单多边形的所有顶点。点集内点的顺序为绕多边形逆时针。

2. 选择 `V` 中相邻的三个顶点 `u` 、`v` 和 `w`。

3. 判断除 `u`、`v` 和 `w` 的其他顶点是否在 `u`、`v`、`w` 形成的三角形内。如果是，回到步骤 2 重新选择。
4. 此时 `u`、`v`、`w` 形成的三角形为 “耳朵”，`v` 为耳尖。从 `V` 中移除点 `v`。将 `u`、`v`、`w` 形成的三角形加入到结果集中。如果 `V` 的大小大于 2，则回到步骤 2。



### 细节

直接看代码吧，懒得写了。😥
