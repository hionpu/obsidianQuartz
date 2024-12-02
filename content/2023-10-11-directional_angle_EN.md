---
title: Drawing Directional Arcs like in Rhino
tags:
  - "#rhino"
  - "#angle"
  - directedangle
  - "#arc"
  - "#geometry"
categories:
  - "[geometry, arc]"
createdAt: 2023-10-11 10:18
lastmod: 2023-12-12 10:18
lang: en
permalink: /posts/directional_angle
pin: true
math: true
mermaid: true
---
# _Changes as of 2023/12/12_
> As of 2023/12/12, most of the implementation methods have been changed due to refactoring. The flowchart is still used.
{: .prompt-warning }

# 1. Understanding the Problem
There are cases where an arc needs to be drawn given three points C, P, Q (center point C and two reference lines CP, CQ).
​

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/364a9e4b-440b-401d-ac1a-903577cffb36)

-   Figure 1-1, Arc PQ

​

Assuming the center point C and the first reference point P are given, let's assume Q can be freely moved by the user using the mouse cursor.  

In Rhino, when drawing an arc (whether drawn directly or when drawing auxiliary lines for functions like Rotate, Revolve), the arc starts to be drawn towards the initial position of the mouse cursor Q relative to CP (see below Figure 1-2).
​
![img](https://github.com/hionpu/hionpu.github.io/assets/111286364/1015966e-11cc-47eb-bce1-ad057bf6be62)

-   Figure 1-2

In this state, if the cursor is moved in the direction of increasing the angle without crossing the ray starting at C and passing through P, the length of the arc extends in that direction until it reaches 360 degrees.  

If the cursor is moved in the direction of decreasing the angle and crosses the ray CP, then from that point onwards, the arc drawn will have an acute angle of CPQ as its central angle.  

# 2. Analyzing the Situation

This can be represented in a flowchart as follows.

​![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/36b366d0-4b25-4751-93db-04ace54d902e)

The problems to be solved here are as follows.  

1\. What is the condition to determine if the cursor has crossed the ray CP?  

2\. What is the condition to determine that the crossing occurred on the ray CP starting from C, not the entire line?  

3\. How to reverse the arc after crossing?  
# 3. Preparing the Solution
```
// Explained below

bool isRightRay;

int crossSign;

​

// When a crossing occurs, it's necessary to check if the previous crossing happened on the ray CP. This bool stores the `crossSign` value from the previous crossing event.

int oldCrossSign;

​

// Explained below

bool crossOccured;

​

// Sign value determining the direction of the arc. If a negative angle is passed to the function drawing the arc, 2π is added to that value.

double angleSign = 1.0;

```

​

## 3-1. Determine if the Cursor Crosses the Ray CP
In Windows, the screen coordinate system has the top left corner as the origin, with the positive direction of $y$ downwards and $x$ to the right.
![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/ea40fe9a-b1fe-41c7-97f6-5cdc40876927)

The arc should flip only when the mouse cursor $Q$ crosses the ray starting at $C$ and passing through $P$. In all other cases, the central angle of the arc should continue to increase or decrease in the same direction.  

First, let's assume the equation of line CP as $$y = mx + n$$. Now,
1.  Detect when the mouse crosses the line CP (not the ray, but the infinite line passing through C, P).

2.  Determine if that crossing occurred on the ray CP.

### 3-1-1. Detect if Cursor Crosses the Line

    We will use the _cross product_. The direction of $\\overrightarrow{CP} \\times \\overrightarrow{CQ}$ changes depending on whether $Q$ is above or below the line CP, so tracking this direction can detect if the mouse cursor has crossed the ray. The direction can be determined by taking the dot product with the $z$ direction unit vector.
```
// Vector CF with x,y components of CQ and z component 0
vector3 CF = new Vector3(CQ, 0); 

// Vector CP with x,y components of CP and z component 0
vector3 CP = new Vector3(CP, 0); 

// Cross product of CF and CP
vector3 cross = CF.cross(CP);

// z direction unit vector
vector3 zUnit = new Vector3(0,0,1); 
​
// Set direction to 1 or -1 based on the dot product of CF x CP and z
double crossSign = cross.Dot(z) > 0 ? 1 : -1;

// True if crossing occurred on the 'ray' CP
bool crossOccured = false;
```

​

### 3-1-2. Determinine if the Crossing Occurred on the Ray CP
There are two types of rays: when the center of the arc C is to the left of the starting point of the arc radius P, and when it's to the right. For convenience, let's call the ray `Ray` and the case where P is to the right of C, making the `Ray` extend to the right, as `RightRay`. First, determine if the line is a `RightRay` and store it as a `bool` value.
```
bool isRightRay = C.X <= P.X 
```
As shown in the code above, the left/right determination of C, P is made using their x coordinates.  

Assuming a crossing has already occurred, the case where cursor Q crosses the ray CP is simply when the x coordinate of Q is also greater than the x coordinate of C.
## 3-2. Implement the Conditions in Code

Following the above conditions, the code can be written as follows.
```
if (isRightRay)
{
    if (point.X > C.X)
    {
        crossOccured = true;
        // ----- Part needing explanation ----
        if (point.Y > m * point.X + n)
        {
            angleSign = 1.0;
        }
        else angleSign = -1.0;
        // ------------------------------------
    }
    else
    {
        crossOccured = false;
  

  }
}
```
The unexplained part in this code is
```
        if (point.Y > m * point.X + n)
        {
            angleSign = 1.0;
        }
        else angleSign = -1.0;
```
This part determines the `angleSign` based on whether the mouse cursor is above (crossing from below to above) or below (crossing from above to below) the line CP after crossing the ray CP, thus drawing the arc in the corresponding direction (the smaller angle formed by CP and CF).

Now, we just need to handle the case where it's not a `RightRay`.

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
The complete code for the `DetectCross()` function is as follows.
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

## 3-3. Apply to Mouse Event Handler
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
1.  Retrieve the mouse coordinates on the screen `mousePos`.
2.  Project the screen coordinates onto the actual plane (`_plane`) where the arc will be drawn `_refPoint`.
3.  Use the `DetectCross()` function to determine if the mouse has crossed the ray CP, and change or maintain `angleSign` accordingly.
4.  Use the `GetAngle()` function to calculate the angle between CP (`P` = `_startPoint`) and CQ (`Q` = `refPoint`, cursor) and store it in `_angle`. Here, the angle is not calculated using the usual dot product, so it returns the actual value even if it's more than $\\pi$ (function below).
5.  Insert `angleSign * _angle` as the central angle parameter in the function creating the arc. Here, the function `Arc()` draws in the opposite direction if a negative central angle is input.
## 3-4 Function
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
When `a`, `b` are passed as parameters, the angle between two vectors, starting at `_center` and ending at `a`, `b` respectively, is calculated. If the direction of the plane's _normal_ and the cross product of `Vector3 aa`, `bb` (determined by dot product) are the same, the angle is returned as is. If the directions are different, the angle subtracted from $2\\pi$ is returned, allowing to obtain the actual value of the angle even if it's greater than $\\pi$, depending on _normal_.