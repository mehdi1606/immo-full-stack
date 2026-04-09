package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {

    List<PropertyImage> findByPropertyIdOrderByDisplayOrderAsc(Long propertyId);

    void deleteByPropertyId(Long propertyId);

    /** Return all image URLs stored in property_images table */
    @org.springframework.data.jpa.repository.Query("SELECT pi.url FROM PropertyImage pi")
    java.util.Set<String> findAllUrls();
}
