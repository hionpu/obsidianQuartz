---
title: Rhino처럼 방향이 있는 arc 그리기
tags:
  - "#rhino"
  - "#angle"
  - directedangle
  - "#arc"
  - "#geomtery"
categories:
  - "[geometry, arc]"
createdAt: 2023-10-11 10:18
lastmod: 2023-12-12 10:18
lang: ko
permalink: /posts/directional_angle
pin: true
math: true
mermaid: true
---
# _2023/12/12 변경점_
>2023/12/12 기준 리팩토링으로 대부분의 구현 방식을 바꿨다. 순서도는 그대로 사용했다.
{: .prompt-warning }

# 1. 문제상황
세 점 C, P, Q(중심점C 과 두 기준선 CP, CQ)이 주어지고 호를 그려야 하는 경우가 있다.
​

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/364a9e4b-440b-401d-ac1a-903577cffb36)

-   그림 1-1, 호 PQ

​

중심점 C와 첫 번째 기준점 P는 주어져 있다고 가정하고 Q는 마우스 커서로 사용자에 의해 자유롭게 움직일 수 있다고 가정하자.  

라이노에서는 호를 그릴 때 (직접 그리든, Rotate, Revolve 등의 기능에서 필요한 보조선을 그리기 위해서든) 마우스 커서 Q의 CP에 대한 처음 위치에 따라 일단 그쪽에 호를 그리기 시작한다(아래 그림 1-2).
​
![img](https://github.com/hionpu/hionpu.github.io/assets/111286364/1015966e-11cc-47eb-bce1-ad057bf6be62)

-   그림 1-2

그 상태에서 C에서 시작해 P를 지나는 반직선을 지나지 않은 채 각도를 늘리는 방향으로 커서를 움직이면 360도에 도달할때까지 그 방향으로 호의 길이가 늘어난다.  

만약 각도를 줄이는 방향으로 움직이다가 커서가 반직선 CP를 지나 CP 아래에 놓이게 되면 그때부터 그려지는 호는 CPQ의 예각을 중심각으로 하는 호가 된다.  

# 2. 분석

이것을 순서도로 표현하면 다음과 같다.

​![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/36b366d0-4b25-4751-93db-04ace54d902e)

여기서 해결해야 할 문제는 다음과 같다.  

1\. 커서가 반직선 CP를 통과(교차)하는 것을 판단할 조건은 무엇인가?  

2\. 통과한 부분이 직선 전체가 아닌 C에서 시작하는 반직선 CP인 것을 판단할 조건은 무엇인가?  

3\. 통과한 후에 호를 새롭게 그릴 때 어떻게 호를 뒤집을 것인가?  
# 3. 준비
```
// 아래에서 설명

bool isRightRay;

int crossSign;

​

//교차가 일어났을 때 이전에 일어났던 교차가 반직선 $CP$ 위에서 일어났는지 확인해야 한다. 이전에 교차 사건 발생시의 `crossSign`값을 저장할 bool

int oldCrossSign;

​

// 아래에서 설명

bool crossOccured;

​

// 호가 그려질 방향을 정하는 부호값. 호를 그리는 함수에 각도를 음수로 전달하면 해당 값에 2파이를 더해서 그림

double angleSign = 1.0;

```

​

## 3-1. 커서가 반직선 CP를 통과하는 것을 판단
윈도우에서 화면 좌표계는 왼쪽 위 구석이 원점이고 아래 방향이 $y$ 의 양의 방향, 오른쪽 방향이 $x$ 의 양의 방향이다.
![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/ea40fe9a-b1fe-41c7-97f6-5cdc40876927)

마우스 커서 $Q$가 $C$에서 시작해서 $P$를 지나는 반직선을 지나는 경우에만 호가 뒤집혀야 하고 이 경우 이외에는 계속 해당 방향으로 호의 중심각이 커지거나 작아져야 한다.  

먼저 $CP$의 직선의 방정식을 $$y = mx + n$$ 으로 둔다. 이제,
1.  일단 반직선 $CP$ 가 아닌 $C$, $P$ 를 지나는 무한한(그래봤자 화면 크기가 최대 범위) 직선을 마우스가 지날 때(cross)를 탐지한다.

2.  그 지점이 반직선 $CP$ 위에서 일어났는지 판단한다.
### 3-1-1. 직선을 지났는지 탐지하기

    _cross product_ 를 이용할 것이다. $\\overrightarrow{CP} \\times \\overrightarrow{CQ}$ 의 방향은 $Q$ 가 직선 $CP$ 위에 있는지 아래에 있는지에 따라 변하므로 이 방향만 추적하면 마우스 커서가 반직선을 지났는지 탐지할 수 있다. 방향을 확인하는 방법은 $z$ 방향의 단위벡터와 dot product를 해서 알아낼 수 있다.
```
// CQ벡터의 x,y성분을 각각 x,y성분으로 갖고 z성분은 0인 벡터
vector3 CF = new Vector3(CQ, 0); 

// CP벡터의 x,y성분을 각각 x,y성분으로 갖고 z성분은 0인 벡터
vector3 CP = new Vector3(CP, 0); 

//CF와 CP의 외적
vector3 cross = CF.cross(CP);

//z 방향 단위벡터
vector3 zUnit = new Vector3(0,0,1); 
​
// CF x CP 와 z의 내적에 따라 방향을 1 또는 -1로 정함
double crossSign = cross.Dot(z) > 0 ? 1 : -1;

// '반직선' CP에서 교차가 일어났다면 true
bool crossOccured = false;
```

​

### 3-1-2. 그 교차가 반직선 CP 위에서 일어났는지 판단하기
반직선의 유형은 두가지로 나뉘는데 호의 중심 $C$ 가 호 반지름의 시작점 $P$ 의 왼쪽에 있는 경우와 오른쪽에 있는 경우이다. 편의상 반직선을 `Ray`라 하고 $P$가 $C$보다 오른쪽에 있어 `Ray`가 오른쪽으로 뻗어나가는 경우를 `RightRay`라 하자. 그리고 이 직선이 `RightRay`인지 먼저 판단해서 `bool`값으로 저장한다.
```
bool isRightRay = C.X <= P.X 
```
위 코드처럼 $C$, $P$ 의 좌/우 판단은 각 점의 $x$ 좌표로만 판단하면 된다.  

교차가 이미 일어났다고 가정하면, 커서 $Q$ 가 반직선 $CP$ 를 지나는 경우는 커서의 $x$ 좌표 역시 $C$의 $x$ 좌표보다 크면 된다.
## 3-2. 위 조건 분기에 따른 코드

이제 위 조건들에 따라 코드를 작성하면 다음과 같다.
```
if (isRightRay)
{
    if (point.X > C.X)
    {
        crossOccured = true;
        // ----- 설명이 필요한 부분 ----
        if (point.Y > m * point.X + n)
        {
            angleSign = 1.0;
        }
        else angleSign = -1.0;
        // ---------------------------
    }
    else
    {
        crossOccured = false;
    }
}
```
이 코드에서 설명되지 않은 부분은
```
        if (point.Y > m * point.X + n)
        {
            angleSign = 1.0;
        }
        else angleSign = -1.0;
```
이 부분인데 이것은 반직선 $CP$ 를 통과한 후에 마우스 커서가 $CP$ 보다 위에 있는지(아래에서 위로 통과) 또는 아래에 있는지(위에서 아래로 통과)에 따라 해당 방향으로($CP$와 $CF$가 이루는 각 중 작은 각을 중심각으로 가지는) 호를 그리도록 `angleSign`을 정해주는 코드이다.

이제 `RightRay`가 아닌 경우를 처리하면 되는데 이것은 간단하다.

```
else
{
    if (point.X <= C.X)
    {
        crossOccured = true;
        if (point.Y > m * point.X + n)
        {
            angleSign = -1.0;
        }
        else angleSign= 1.0;
    }
    else
    {
        crossOccured = false;
    }
}
```
교차를 감지하는 `DetectCross()` 함수 전체 코드는 다음과 같다.
```
Vector2D C;
Vector2D F;

private void DetectCross(System.Windows.Point point)
{
    Vector2 _CF = F.ToVector2() - C.ToVector2();
    Vector2 _CP = point.ToVector2D() - C.ToVector2();​

    Vector3 CF = new Vector3(_CF, 0);
    Vector3 CP = new Vector3(_CP, 0);

    Vector3 z = new Vector3(0, 0, 1);
    Vector3 cross = Vector3.Cross(CF, CP);​

    crossSign = cross.Dot(z) > 0 ? 1 : -1;​

    if (oldCrossSign != crossSign)
    {
        if (isRightRay)
        {
            if (point.X > C.X)
            {
                crossOccured = true;
                if (point.Y > m * point.X + n)
                {
                    angleSign = 1.0;
                }
                else angleSign = -1.0;
            }
            else
            {
                crossOccured = false;
            }
        }
        else
        {
            if (point.X <= C.X)
            {
                crossOccured = true;
                if (point.Y > m * point.X + n)
                {
                    angleSign = -1.0;
                }
                else angleSign= 1.0;
            }
            else
            {
                crossOccured = false;
            }
        }
    }
}
```

​

## 3-3. 마우스 이벤트 핸들러에 적용
```
private void MouseMove(object sender, MouseEventArgs e)
{
    var mousePos = e.GetPosition(screen);
    _refPoint = screen.ScreenToWorld(mousePos, _plane);
​
    if (_refPoint != null)
    {
        DetectCross(mousePos);
        if (crossOccured)
        {
            crossOccured = false;
        }
        _angle = GetAngle(_startPoint, _refPoint);
        _arc = new Arc(_center, _startPoint, angleSign*_angle, _normal)
        oldCrossSign = crossSign;
    }
}
```
1.  마우스의 좌표를 화면상에서 가져온다 `mousePos`
2.  화면상 좌표를 실제 호가 그려질 평면(`_plane`)으로 투영한다 `_refPoint`
3.  `DetectCross()` 함수를 이용해 마우스가 반직선 $CP$를 통과했는지 판단하고, 각 경우에 따라 `angleSign`을 바꾸거나 그대로 둔다.
4.  `GetAngle()` 함수를 이용해 $CP$( $P$ = `_startPoint`)와 $CQ$($Q$ = `refPoint`, 커서) 의 각도를 구하고 `_angle` 에 저장한다. 여기서 각도는 일반적인 내적을 이용하지 않기 때문에 $\\pi$ 이상이라도 그 값 그대로 반환한다(아래에 함수 있음).
5.  `angleSign * _angle`을 호를 만드는 함수의 중심각 파라미터에 넣어준다. 여기서 호를 만드는 함수 `Arc()`는 중심각을 음수로 입력하면 방향을 반대로 그려준다.
## 3-4 함수
```
Point3D _center;
private double GetAngle(Point3D a, Point3D b)
       {
           if (a == b) return 0;
​
           Vector3 aa = _center.ToVector3() - a.ToVector3();
           Vector3 bb = _center.ToVector3() - b.ToVector3();​
           Vector3 nn = aa.Cross(bb);​
           double d = nn.Dot(normal);​
           double angle = aa.Angle(bb);
           
           if (d >= 0)
           {
               return angle;
           }
           else
           {
               return Math.PI * 2 - angle;
           }
       }
```
`a`, `b`를 파라미터로 전달하면 `_center`를 시작점으로, `a`, `b`를 각각 끝점으로하는 두 벡터 사이의 각을 구한다. 이때, 두 벡터가 놓인 평면의 _normal_ 과 `Vector3 aa`, `bb` 의 외적이 (내적 계산을 통해)방향이 같으면 각을 그대로 반환하고, 방향이 다르면 $2\\pi$에서 뺀 각을 반환함으로써 _normal_ 에 따라 각이 $\\pi$ 보다 크더라도 그 값을 그대로 얻을 수 있다.

