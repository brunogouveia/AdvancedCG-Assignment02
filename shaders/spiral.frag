#version 130
//  Spiral fragment shader
//  

//  Colors used in the texture
const vec4 BackGroundColor  = vec4(.7, .7, .7, 1.0);   
const vec4 SpiralColor      = vec4(0.0, 0.0, 0.0, 1.0);

// Parameters of the spiral's equation
const int maxRadium = 20;
const float a = 0.001;
const float b = 0.1;

// Mathematical definitions
const float M_PI = 3.1415926535897932384626433832795;

//  Model coordinates and light from vertex shader
varying float LightIntensity;
varying vec2  ModelPos;
varying float Zoom;



// This is basically time % PI
uniform float offset;

void main()
{
   // All spiral's points are defined as (r,theta) s.t. r = a*exp(b*theta)
   // Therefore, to check if point (x,y) is in the spiral, the following must be true:
   //          f(r,theta) = a*exp(b*theta) - r < e
   // For a smal constant e.

   // Compute length of ModelPos
   // This is the radius of (x,y) in polar coordinates
   float r = length(ModelPos);

   // Compute the angle of ModelPos 
   // Note that atan returns a number in the interval [-PI, +PI] rather than [0, 2PI], but that is okay.
   float theta = (ModelPos.x != 0.0) ? atan(ModelPos.y, ModelPos.x) : 0.0;
   // Add offset in order to give motion to the spiral
   theta += offset;

   // Initialize the color of the fragment.
   vec4 fColor = BackGroundColor;
   
   // If we only allow points with theta in the interval [-PI, +PI], we'll have a really small spiral.
   // We must add "+k*2PI" and "-k*2PI" to theta, in order to obtain other points of the spiral.
   float eTheta = a*exp(b*theta);	//Initial value
   float e2PI = exp(b*2.0*M_PI);		//The increment
   float pK2PI = eTheta / e2PI;		//Current value of a*exp(b*(theta+k*2PI))
   float mK2PI = eTheta;			   //Current value of a*exp(b*(theta-k*2PI))
   for(int k = 0; k <= maxRadium; k++) 
   {
      // First try to add "+k*2PI" and check if this fragment is a point in the spiral.
      pK2PI = pK2PI * e2PI;
      if (abs(pK2PI - r) < 0.01 * Zoom) 
         fColor = SpiralColor;

      // Now try to add "-k*2PI" and check if this fragment is a point in the spiral.
      mK2PI = mK2PI / e2PI;
      // r2 = a*exp(b*(theta - k*2*M_PI));
      if (abs(mK2PI - r) < 0.01 * Zoom)
         fColor = SpiralColor;
   }

   gl_FragColor = fColor * LightIntensity;

   // I actually tried to use isomorphism to make the shader faster, because I could use adition of
   // ln(a) + b*theta -ln(r) instead of compute the exponencial of b*theta in each iteratio of the loop for.
   // However I need to check if (r2 - r) < 0.01, so it doens't work.
}
