import React, { useEffect, useState } from "react";
import { Table, Container } from "react-bootstrap";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

function DonorList() {
    const [donors, setDonors] = useState([]);

    useEffect(() => {
    // Fetch donors from Firestore
    }, []);

    return (
    <Container className="mt-5">
        <h2>Available Donors</h2>
        <Table striped bordered hover>
        <thead>
            <tr>
            <th>Name</th>
            <th>Blood Group</th>
            <th>Location</th>
            <th>Contact</th>
        </tr>
        </thead>
        <tbody>
          {/* Map donor list here */}
        </tbody>
    </Table>
    </Container>
    );
    }
export default DonorList;
