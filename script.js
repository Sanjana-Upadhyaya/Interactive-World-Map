const width = document.getElementById("map").clientWidth;
const height = document.getElementById("map").clientHeight;

const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// Map projection and path
const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.8]);
const path = d3.geoPath().projection(projection);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip hidden")
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "10");


const manualData = {
    "N. Cyprus": { area: 3355 }, // in km²
    "W. Sahara": { area: 266000 }, // in km²
    "Somaliland": { area: 137600 }, // in km²
    "Fr. S. Antarctic Lands":{ area: 439666}
};    
// Custom mappings for mismatched country names
const countryNameMappings = {
    "United States of America": "United States",
    "Dominican Rep.":"Dominican Republic",
    "Falkland Is.":"Falkland Islands",
    "Macedonia":"North Macedonia",
    "Bosnia and Herz.":"Bosnia and Herzegovina",
    "S. Sudan":"South Sudan",
    "Central African Rep.":"Central African Republic",
    "Côte d'Ivoire":"Ivory Coast",
    "Dem. Rep. Congo":"DR Congo",
    "Eq. Guinea":"Equatorial Guinea",
    "Congo":"Republic of the Congo",
    "eSwatini":"Eswatini",
    "Solomon Is.":"Solomon Islands"
    // Add other custom mappings as needed
};

Promise.all([
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json"), // World map
    d3.json("https://restcountries.com/v3.1/all"), // Country data
    d3.json("india-soi.geojson") // India's outline (not state-level)
]).then(([world, countries, india]) => {
    // Process REST API country data
    const countryInfo = {};
    countries.forEach(country => {
        countryInfo[country.name.common] = {
            capital: country.capital ? country.capital[0] : "N/A",
            area: country.area || "N/A"
        };
    });

    // World map processing
    const geoData = topojson.feature(world, world.objects.countries);
    geoData.features.forEach(feature => {
        let name = feature.properties.name;
        if (name === "India") {
            feature.properties.capital = "New Delhi";
            feature.properties.area = "3,287,590";
        }
        if (countryNameMappings[name]) {
            name = countryNameMappings[name];
        }
        // Add manual data for disputed lands
        if (manualData[name]) {
            feature.properties.capital = "N/A";
            feature.properties.area = manualData[name].area;
        } else if (countryInfo[name]) {
            feature.properties.capital = countryInfo[name].capital;
            feature.properties.area = countryInfo[name].area;
        } else {
            feature.properties.capital = "N/A";
            feature.properties.area = "N/A";
        }
        
    });


    // Render World Map
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country")
        .style("fill", "#000000")
        .style("stroke", "#826e3c")
        .style("stroke-width", "0.75")
        .on("mouseover", function(event, d) {
            tooltip.classed("hidden", false)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .html(`<strong>Country:</strong> ${d.properties.name}<br>
                       <strong>Capital:</strong> ${d.properties.capital}<br>
                       <strong>Area:</strong> ${d.properties.area} km²`);
            d3.select(this).style("fill", "#ffffff");
        })
        .on("mouseout", function() {
            tooltip.classed("hidden", true);
            d3.select(this).style("fill", "#000000");
        });

    // Add India outline
    svg.selectAll(".india")
        .data(india.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "india")
        .style("fill", "none")
        .style("stroke", "#826e3c") // Distinct stroke for India
        .style("stroke-width", "0.75")
        .on("mouseover", function(event, d) {
            tooltip.classed("hidden", false)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .html(`<strong>Country:</strong> India <br>
                       <strong>Capital:</strong> New Delhi <br>
                       <strong>Area:</strong> 3287590 km²`);
            d3.select(this).style("fill", "#ffffff");
        })
        .on("mouseout", function() {
            tooltip.classed("hidden", true);
            d3.select(this).style("fill", "#000000");
        });

});

