import React, { useState } from "react";
import { 
  Container, 
  Carousel, 
  CarouselItem,
  Button
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// Sample slider images
const sliderItems = [
  {
    id: 1,
    image: "/bg1.jpg",
    title: "Donate Blood, Save Lives",
    description: "Your single donation can help up to 3 people in need",
    buttonText: "Become a Donor",
    buttonLink: "/Signup"
  },
  {
    id: 2,
    image: "/banner2.jpg",
    title: "Emergency Blood Requests",
    description: "Find blood donors in your area quickly",
    buttonText: "Request Blood",
    buttonLink: "/RequestDashboard"
  },
  {
    id: 3,
    image: "https://mcdn.wallpapersafari.com/medium/93/45/9uxMUT.jpg",
    title: "Join Our Community",
    description: "Over 10,000 lives saved this year",
    buttonText: "Learn More",
    buttonLink: "/about"
  }
];

function HeroSlider() {
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  return (
    <Carousel 
      activeIndex={index} 
      onSelect={handleSelect}
      fade
      controls={true}
      indicators={true}
      className="hero-slider"
    >
      {sliderItems.map((item) => (
        <CarouselItem key={item.id}>
          <div 
            className="slider-item"
            style={{ 
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '80vh',
              position: 'relative'
            }}
          >
            <div className="slider-overlay">
              <Container className="h-100 d-flex align-items-center">
                <div className="slider-content text-white">
                  <h1 className="display-4 fw-bold mb-3">{item.title}</h1>
                  <p className="lead mb-4">{item.description}</p>
                  <Button 
                    variant="danger" 
                    size="lg"
                    href={item.buttonLink}
                  >
                    {item.buttonText}
                  </Button>
                </div>
              </Container>
            </div>
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  );
}

// Add this CSS to your stylesheet
const sliderStyles = `
  .hero-slider {
    position: relative;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .carousel-indicators button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    background: transparent;
  }
  
  .carousel-indicators .active {
    background: white;
  }
  
  .slider-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
  }
  
  .slider-content {
    max-width: 600px;
  }
  
  @media (max-width: 768px) {
    .slider-item {
      height: 60vh !important;
    }
    
    .slider-content h1 {
      font-size: 2.5rem;
    }
  }
`;

// Add the styles to the head
const styleElement = document.createElement("style");
styleElement.innerHTML = sliderStyles;
document.head.appendChild(styleElement);

export default HeroSlider;