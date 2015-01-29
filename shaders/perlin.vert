#version 130

// Varying variables
varying float LightIntensity;
varying vec4 vertex;

float phong()
{
	// Position of point in eye's coordinate
	vec3 pos = vec3(gl_ModelViewMatrix * gl_Vertex);

	// Normal in eye's coordinate
	vec3 n = normalize(vec3(gl_NormalMatrix * gl_Normal));

	// Light vector
	vec3 l = normalize(gl_LightSource[0].position.xyz - pos);

	// Reflection vector
	vec3 r = reflect(-l,n);

	// Eye is always in the origin, so v is -pos
	vec3 v = normalize(-pos);

	// Compute Id, make sure that you don't use a negative value
	float Id = max(0.0, dot(n, l));

	// Compute Is
	float Is = (Id > 0.0) ? pow(dot(r, v), gl_FrontMaterial.shininess) : 0.0;

	// Ignore emission and global ambient light
	vec4 color = gl_FrontLightProduct[0].ambient
		+ Id*gl_FrontLightProduct[0].diffuse
		+ Is*gl_FrontLightProduct[0].specular;

	// Return just intensity of color
	return length(color);
}

void main()
{
	// Compute light intensity on the vertex
	LightIntensity = phong();

	// Tranform vertex to the right position
	gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	vertex = (gl_Vertex/gl_Vertex.w + 1.0)*0.5;
}