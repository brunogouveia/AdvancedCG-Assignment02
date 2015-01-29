#version 130

/**
 *	This is an implemetation of perlin noise with few modifications.
 * Almost everything presented here comes from http://mrl.nyu.edu/~perlin/paper445.pdf and 
 * http://www.noisemachine.com/talk1/ (both from Ken Perlin).
 */

//  Model coordinates and light from vertex shader
varying float LightIntensity;
varying vec4 vertex;

uniform float time;

// The smoothe curve described in the article.
float sCurve(float t) { 
	return pow(t, 3) * (t * (t * 6 - 15) + 10);
}


float gradMaroto(float index, float x, float y, float z)
{
	int hash = int(floor(index)) % 16;
	bool isOdd = ((hash & 1) != 0);
	float inProd = 0.0; //Inner product
	
	// We slightly changed ther order of gradients described in the article, we're gona use:
	// (1,1,0),(-1,1,0),(1,-1,0),(-1,-1,0),
	// (1,0,1),(-1,0,1),(1,0,-1),(-1,0,-1),
	// (0,1,1),(0,-1,1),(0,1,-1),(0,-1,-1),
	// (1,1,0),(0,-1,1),(-1,1,0),(0,-1,-1)

	// Note that all the gradients has exactly two components different from zero, and they are well
	// behavored, so let's use that to make few comparisons.
	float a = (hash < 8) ? x : y; 	//We won't gonna check here if is odd or even, because it would be slower (due to MDSI)
									//Also note that all elements < 8 has x!=0 and all elements >=8 have y!=0
	float b = (hash < 4) ? y : (hash == 12 || hash == 14) ? x : z;

	// Now we check if a is odd (because if a == x or a ==y, if it's odd we should subtract a)
	// In the case of b, if the deivision of hash by 2 is odd, then we should subtract, otherwise we should add b.
	return ((isOdd) ? -a : a) + (((hash / 2) & 1) == 1 ? -b : b);
}

// Ideally we should use mod of 256, however we would need to keep a permutation vector and random asscess to memory that can make
//the shader really slow, so let's use mod 289 and still get awesome textures.
float mod289(float x)
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
 
// This function a found at the internet, it probably works
float permute(float x)
{
    return mod289(((x*34.0)+1.0)*x);
}



float noise(float x, float y, float z) {
	// Save the integer part
	float X = mod289(floor(x));
	float Y = mod289(floor(y));
	float Z = mod289(floor(z));

	// The fractional part
	x = fract(x);
	y = fract(y);
	z = fract(z);

	// Compute sCurve for each dimension
	float sx = sCurve(x);
	float sy = sCurve(y);
	float sz = sCurve(z);

	// Compute the inner product of each gradient with (P-Q), where P is the point and
	//Q is the correspondent grid point. 
	float v000 = gradMaroto(permute(X + (permute(Y + permute(Z)))), x, y, z);
	float v100 = gradMaroto(permute(X + 1 + (permute(Y + permute(Z)))), x-1, y, z);
	float v010 = gradMaroto(permute(X + (permute(Y + 1 + permute(Z)))), x, y-1, z);
	float v110 = gradMaroto(permute(X +1+ (permute(Y + 1 + permute(Z)))), x-1, y-1, z);

	float v001 = gradMaroto(permute(X + (permute(Y + permute(Z+1)))), x, y, z - 1);
	float v101 = gradMaroto(permute(X + 1 + (permute(Y + permute(Z+1)))), x-1, y, z - 1);
	float v011 = gradMaroto(permute(X + (permute(Y + 1 + permute(Z+1)))), x, y-1, z - 1);
	float v111 = gradMaroto(permute(X +1+ (permute(Y + 1 + permute(Z+1)))), x-1, y-1, z - 1);

	// Compute the linear interpolation using the values of sCurve
	float xm1 = mix(v000, v100, sx);
	float xm2 = mix(v010, v110, sx);
	float xm3 = mix(v001, v101, sx);
	float xm4 = mix(v011, v111, sx);

	float ym1 = mix(xm1, xm2, sy);
	float ym2 = mix(xm3, xm4, sy);

	//Return the result
	return mix(ym1, ym2, sz);
}


void main()
{
	//Initialize f
	float f = 0.0;

	// This is basically a turbulance function. We're adding noise with different frequencies and amplitudes.
	for (int i = 2044; i > 1; i = i/2){
		f += 2*abs(noise(i*(vertex.x + cos(time)), i*(vertex.y + sin(time)), i*(vertex.z + sin(-time)))/i);
	}

	// Multiply by light intensity computed in vertex shader.
	gl_FragColor = vec4(f, f, f, 1.0)*LightIntensity;
}